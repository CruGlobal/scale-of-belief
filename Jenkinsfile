#!groovy
@Library('jenkins-jobs@add-cru-udp-pipeline-job') _

serverlessPipeline(
  defaultEnvironment: 'production',
  ecsConfigBranch: 'managed-snowplow-lambda-updates',
  packageManager: 'yarn'
)
