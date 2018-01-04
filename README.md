# serverless-cloudformation-parameter-setter
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)

Serverless framework plugin to set CloudFormation Parameters when deploying

## Installation

Install the plugin from npm

```bash
$ npm install --save serverless-cloudformation-parameter-setter
```

Add the plugin to your `serverless.yml` file:

```yaml
plugins:
  - serverless-cloudformation-parameter-setter
```

## Usage
#### CLI options
None

#### YAML settings
```yaml
custom:
  cfParameters:
    secretPassword: whatever # this could be serverless ssm variable or s3 variable or plaintext or whatever, do what you want

resources:
  # define the cloudformation parameters here
  Parameters:
    secretPassword:
      Type: string
      Description: database password
      NoEcho: true # keep it secret, keep it safe
  # use the parameters here
  Resources:
    TheDatabase:
      Type: AWS::RDS::DBInstance
      Properties:
        Engine: MySQL
        DBInstanceIdentifier: MySQL
        DBName: MySQL
        MultiAZ: true
        PubliclyAccessible: true
        MasterUsername: root
        MasterUserPassword: { Ref: secretPassword } # you can also send this to a lambda's env var
        DBInstanceClass: db.t2.large
        AllocatedStorage: 100
        DBSubnetGroupName:
          Ref: DBSubnetGroup # not included in this example
        VPCSecurityGroups:
          - Ref: DBSecurityGroup # not included in this example
```

