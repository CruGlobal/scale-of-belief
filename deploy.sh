#!/usr/bin/env bash

# Set PROJECT_NAME and ENVIRONMENT for testing/demo
export PROJECT_NAME=scale-of-belief-lambda
export ENVIRONMENT=staging

set -x && \
    ./node_modules/.bin/serverless deploy --stage $ENVIRONMENT --package dist/$ENVIRONMENT-$BUILD_NUMBER --verbose
