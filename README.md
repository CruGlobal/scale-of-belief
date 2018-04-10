# Scale of Belief - Lambda functions

This repo contains the scale of belief placement, api and admin application lambda functions.

## Requirements
* NodeJS >= 6.10.3
* PostgreSQL

## Installation
Clone the repository and install dependencies:
```bash
git clone git@github.com:CruGlobal/scale-of-belief-lambda.git
cd scale-of-belief-lambda
npm install
```

Create `.env` file and add any ENV overrides ([defaults](https://github.com/CruGlobal/scale-of-belief-lambda/blob/master/config/environment.js))
Create the database and run migrations (including test):
```bash
npm run db:create
npm run db:migrate
```

## Running
Scale of Belief has multiple lambda functions which can be run locally for development.

### Placement
```bash
./node_modules/.bin/serverless invoke local --function placement --path {path/to/event.js}
```

### API
Start a local webserver running at http://localhost:3000
```bash
./node_modules/.bin/serverless offline start
```


## Testing

Scale of Belief is using [Standard](https://standardjs.com/) style and [jest](https://facebook.github.io/jest/docs/en/getting-started.html) for testing.
```bash
# Create and setup test database
npm run db:create:test
npm run db:migrate:test

# Run lint, optionally auto fix issues
npm run lint
npm run lint:fix

# Run tests
npm test
```

## Deployment (without travis)

`build.sh` and `deploy.sh` are currently hard-coded to deploy to the staging environment. These files can be used to
deploy to lambda using serverless and are an example of what Jenkins will eventually do when code is merged to the
`master` or `staging` branched of the github repo.

#### Blackbox
Make sure ECS_CONFIG environment variable is set to the location where you have [ecs_config](https://github.com/CruGlobal/ecs_config) checked out. You'll
probably want to add this to your `~/.bash_profile`.
```bash
export ECS_CONFIG=/Users/brian/src/other/ecs_config
```
```bash
~$ echo $ECS_CONFIG
/Users/brian/src/other/ecs_config
```

Ensure blackbox scale-of-belief-lambda staging files are decrypted.
```bash
~$ cd $ECS_CONFIG
ecs_config$ blackbox_edit_start ecs/scale-of-belief-lambda/env.staging.gpg
ecs_config$ cd -
~$
```

#### Build (package)
From the project folder. Make sure the staging branch is checked out and all changes are merged (although this will
package and deploy non merged changes, it's best to commit them).
Package the app
```bash
~$ ./build.sh
```
output:
> ```bash
> + rm -rf dist
> + ./node_modules/.bin/serverless package --stage staging --package dist/staging-0 --verbose
> Serverless: Packaging service...
> Serverless: Excluding development dependencies...
> ```

#### Deploy
From the project folder. This will deploy the api, placement and migration lambda functions as well as run migrations
post deployment.
```bash
~$ ./deploy.sh
```
output:
> ```bash
> + ./node_modules/.bin/serverless deploy --stage staging --package dist/staging-0 --verbose
> Serverless: Uploading CloudFormation file to S3...
> Serverless: Uploading artifacts...
> Serverless: Uploading service .zip file to S3 (7.89 MB)...
> Serverless: Validating template...
> Serverless: Updating Stack...
> Serverless: Checking Stack update progress...
> CloudFormation - UPDATE_IN_PROGRESS - AWS::CloudFormation::Stack - scale-of-belief-staging
> CloudFormation - UPDATE_IN_PROGRESS - AWS::Lambda::Function - PlacementLambdaFunction
> CloudFormation - UPDATE_IN_PROGRESS - AWS::Lambda::Function - ApiLambdaFunction
> CloudFormation - UPDATE_IN_PROGRESS - AWS::Lambda::Function - MigrateLambdaFunction
> CloudFormation - UPDATE_COMPLETE - AWS::Lambda::Function - PlacementLambdaFunction
> CloudFormation - UPDATE_COMPLETE - AWS::Lambda::Function - MigrateLambdaFunction
> CloudFormation - UPDATE_COMPLETE - AWS::Lambda::Function - ApiLambdaFunction
> CloudFormation - CREATE_IN_PROGRESS - AWS::ApiGateway::Deployment - ApiGatewayDeployment1523380040023
> CloudFormation - CREATE_IN_PROGRESS - AWS::ApiGateway::Deployment - ApiGatewayDeployment1523380040023
> CloudFormation - CREATE_COMPLETE - AWS::ApiGateway::Deployment - ApiGatewayDeployment1523380040023
> CloudFormation - UPDATE_COMPLETE_CLEANUP_IN_PROGRESS - AWS::CloudFormation::Stack - scale-of-belief-staging
> CloudFormation - DELETE_IN_PROGRESS - AWS::ApiGateway::Deployment - ApiGatewayDeployment1522956184493
> CloudFormation - DELETE_COMPLETE - AWS::ApiGateway::Deployment - ApiGatewayDeployment1522956184493
> CloudFormation - UPDATE_COMPLETE - AWS::CloudFormation::Stack - scale-of-belief-staging
> Serverless: Stack update finished...
> Service Information
> service: scale-of-belief
> stage: staging
> region: us-east-1
> stack: scale-of-belief-staging
> api keys:
>   None
> endpoints:
>   ANY - https://3russg4u9g.execute-api.us-east-1.amazonaws.com/staging/api/{any+}
> functions:
>   placement: scale-of-belief-staging-placement
>   api: scale-of-belief-staging-api
>   migrate: scale-of-belief-staging-migrate
>
> Stack Outputs
> AppBucket: scale-of-belief-staging-app-public
> ServiceEndpoint: https://3russg4u9g.execute-api.us-east-1.amazonaws.com/staging
> ServerlessDeploymentBucketName: scale-of-belief-staging-serverlessdeploymentbucke-5qt7pt0ytthf
>
> Serverless: Removing old service versions...
> "Migrations successful"
> ```

#### Logging
Logs for the lambda functions and api gateway are located in CloudWatch.
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs:

Lambda logs are under the following Log Groups:
* /aws/lambda/scale-of-belief-{`staging`|`production`}-{`api`|`placement`|`migration`}

ApiGateway logs are under the following Log Groups (`api_id` is determined from the `endpoints` output of the deploy.sh command):
* API-Gateway-Execution-Logs_{`api_id`}/{`staging`|`production`}
