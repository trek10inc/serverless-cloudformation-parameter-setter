'use strict'

const deployWithParameters = require('./lib/deployWithParameters')

class ServerlessCloudFormationParameters {
  constructor (serverless, options) {
    try {
      this.serverless = serverless
      this.provider = this.serverless.getProvider('aws')

      let awsDeploy = serverless.pluginManager.plugins.find(p => p.constructor.name === 'AwsDeploy')
      awsDeploy.options.cfParameters = serverless.service && serverless.service.custom && serverless.service.custom['cf-parameters']
      awsDeploy.createParameters = deployWithParameters.createParameters
      awsDeploy.createFallback = Function(awsDeploy.createFallback.toString().replace('Parameters: [],', 'Parameters: this.createParameters(this.options.cfParameters, this.serverless.service.provider.compiledCloudFormationTemplate, false),').slice(18,-1))
      awsDeploy.update = Function(
        awsDeploy.update.toString()
          .replace('Parameters: [],', 'Parameters: this.createParameters(this.options.cfParameters, this.serverless.service.provider.compiledCloudFormationTemplate, true),')
          .replace('NO_UPDATE_MESSAGE', '"No updates are to be performed."')
          .slice(10,-1))
    } catch (e) {
      console.log('Error initializing serverless-cloudformation-parameters', e)
      throw e
    }
  }
}

module.exports = ServerlessCloudFormationParameters
