'use strict';

// const _ = require('lodash');
// const BbPromise = require('bluebird');

// const NO_UPDATE_MESSAGE = 'No updates are to be performed.';

module.exports = {
  createParameters(paramsObject, template, allowPreviousValues) {
    this.serverless.cli.log('Determining cloudformation parameters...')
    let params = []
    if (template.Parameters) {
      Object.keys(template.Parameters).forEach(k => {
        if (allowPreviousValues && (paramsObject[k] === null || paramsObject[k] === undefined)) {
          params.push({
            ParameterKey: k,
            UsePreviousValue: true
          })
        } else {
          params.push({
            ParameterKey: k,
            ParameterValue: paramsObject[k]
          })
        }
      })
    }
    return params
  },
  // the following functions are unused they are just copied from the AWS deploy plugin for reference
  createFallback() {
    this.createLater = false;
    this.serverless.cli.log('Creating Stack...');

    const stackName = this.provider.naming.getStackName();
    let stackTags = { STAGE: this.options.stage };
    const compiledTemplateFileName = 'compiled-cloudformation-template.json';
    const templateUrl = `https://s3.amazonaws.com/${this.bucketName}/${this.serverless.service.package.artifactDirectoryName}/${compiledTemplateFileName}`;

    // Merge additional stack tags
    if (typeof this.serverless.service.provider.stackTags === 'object') {
      stackTags = _.extend(stackTags, this.serverless.service.provider.stackTags);
    }

    const params = {
      StackName: stackName,
      OnFailure: 'ROLLBACK',
      Capabilities: [
        'CAPABILITY_IAM',
        'CAPABILITY_NAMED_IAM',
      ],
      Parameters: this.createParameters(this.options.cfParameters, this.serverless.service.provider.compiledCloudFormationTemplate, false),
      TemplateURL: templateUrl,
      Tags: Object.keys(stackTags).map((key) => ({ Key: key, Value: stackTags[key] })),
    };

    if (this.serverless.service.provider.cfnRole) {
      params.RoleARN = this.serverless.service.provider.cfnRole;
    }

    return this.provider.request('CloudFormation',
      'createStack',
      params,
      this.options.stage,
      this.options.region)
      .then((cfData) => this.monitorStack('create', cfData));
  },

  update() {
    const compiledTemplateFileName = 'compiled-cloudformation-template.json';
    const templateUrl = `https://s3.amazonaws.com/${this.bucketName}/${this.serverless.service.package.artifactDirectoryName}/${compiledTemplateFileName}`;
    this.serverless.cli.log('Updating Stack...');
    const stackName = this.provider.naming.getStackName();
    let stackTags = { STAGE: this.options.stage };

    // Merge additional stack tags
    if (typeof this.serverless.service.provider.stackTags === 'object') {
      stackTags = _.extend(stackTags, this.serverless.service.provider.stackTags);
    }

    const params = {
      StackName: stackName,
      Capabilities: [
        'CAPABILITY_IAM',
        'CAPABILITY_NAMED_IAM',
      ],
      Parameters: this.createParameters(this.options.cfParameters, this.serverless.service.provider.compiledCloudFormationTemplate, true),
      TemplateURL: templateUrl,
      Tags: Object.keys(stackTags).map((key) => ({ Key: key, Value: stackTags[key] })),
    };

    if (this.serverless.service.provider.cfnRole) {
      params.RoleARN = this.serverless.service.provider.cfnRole;
    }

    // Policy must have at least one statement, otherwise no updates would be possible at all
    if (this.serverless.service.provider.stackPolicy &&
        this.serverless.service.provider.stackPolicy.length) {
      params.StackPolicyBody = JSON.stringify({
        Statement: this.serverless.service.provider.stackPolicy,
      });
    }

    return this.provider.request('CloudFormation',
      'updateStack',
      params,
      this.options.stage,
      this.options.region)
      .then((cfData) => this.monitorStack('update', cfData))
      .catch((e) => {
        if (e.message === NO_UPDATE_MESSAGE) {
          return;
        }
        throw e;
      });
  },

  updateStack() {
    console.log('us')
    return BbPromise.bind(this)
      .then(() => {
        if (this.createLater) {
          console.log('us cl')
          return BbPromise.bind(this)
            .then(this.createFallback);
        }
        console.log('us cn')
        return BbPromise.bind(this)
          .then(this.update);
      });
  },
};
