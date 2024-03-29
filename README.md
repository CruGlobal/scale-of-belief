# Scale of Belief - Lambda functions

This repo contains the scale of belief placement, api and admin application lambda functions.

[![codecov](https://codecov.io/gh/CruGlobal/scale-of-belief/branch/master/graph/badge.svg?token=EOFfiP882y)](https://codecov.io/gh/CruGlobal/scale-of-belief)

## Requirements
* NodeJS >= 8.10
* PostgreSQL

## Installation
Clone the repository and install dependencies:
```bash
git clone git@github.com:CruGlobal/scale-of-belief-lambda.git
cd scale-of-belief-lambda
yarn install
```

Create `.env` file and add any ENV overrides ([defaults](https://github.com/CruGlobal/scale-of-belief-lambda/blob/master/config/environment.js))
Create the database and run migrations (including test):
```bash
yarn run db:create
yarn run db:migrate
```

## Running
Scale of Belief has multiple lambda functions which can be run locally for development.

### Placement
```bash
npx serverless invoke local --function placement --path {path/to/event.js}
```

### API
Start a local webserver running at http://localhost:3000
```bash
npx serverless offline start
```


## Testing

Scale of Belief is using [Standard](https://standardjs.com/) style and [jest](https://facebook.github.io/jest/docs/en/getting-started.html) for testing.
```bash
# Create and setup test database
yarn run db:create:test
yarn run db:migrate:test

# Run lint, optionally auto fix issues
yarn run lint
yarn run lint:fix

# Run tests
yarn test
```

## Deployment (without jenkins)

`deploy.sh` is currently hard-coded to deploy to the staging environment. This file can be used to
deploy to lambda using serverless and is an example of what Jenkins will eventually do when code is merged to the
`master` or `staging` branches of the github repo.

#### Deploy
From the project folder. This will deploy all the lambda functions as well as run migrations
post deployment.
```bash
~$ ./deploy.sh
```

#### Logging
Logs for the lambda functions and api gateway are located in CloudWatch.
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs:

Lambda logs are under the following Log Groups:
* /aws/lambda/scale-of-belief-{`staging`|`production`}-{`api`|`placement`|`migration`}

ApiGateway logs are under the following Log Groups (`api_id` is determined from the `endpoints` output of the deploy.sh command):
* API-Gateway-Execution-Logs_{`api_id`}/{`staging`|`production`}
