'use strict'

module.exports = () => {
  // Use dotenv to load local development overrides
  require('dotenv').config()
  return {
    ENVIRONMENT: process.env['ENVIRONMENT'] || 'development',
    DB_ENV_POSTGRESQL_DB: process.env['DB_ENV_POSTGRESQL_DB'] || 'scale_of_belief',
    DB_ENV_POSTGRESQL_USER: process.env['DB_ENV_POSTGRESQL_USER'] || 'scale_of_belief',
    DB_ENV_POSTGRESQL_PASS: process.env['DB_ENV_POSTGRESQL_PASS'] || '',
    DB_PORT_5432_TCP_ADDR: process.env['DB_PORT_5432_TCP_ADDR'] || 'localhost',
    DB_PORT_5432_TCP_PORT: process.env['DB_PORT_5432_TCP_PORT'] || 5432,
    ROLLBAR_ACCESS_TOKEN: process.env['ROLLBAR_ACCESS_TOKEN'] || '',
    JWT_SECRET: process.env['JWT_SECRET'] || 'secret',
    THE_KEY_SERVICE_URL: process.env['THE_KEY_SERVICE_URL'] || 'http://localhost:3000/api/login',
    THE_KEY_API_KEY: process.env['THE_KEY_API_KEY'],
    GLOBAL_REGISTRY_URL: process.env['GLOBAL_REGISTRY_URL'] || 'https://stage-backend.global-registry.org',
    GLOBAL_REGISTRY_TOKEN: process.env['GLOBAL_REGISTRY_TOKEN'] || 'secret',
    REDSHIFT_DB_ENV_POSTGRESQL_DB: process.env['REDSHIFT_DB_ENV_POSTGRESQL_DB'],
    REDSHIFT_DB_ENV_POSTGRESQL_USER: process.env['REDSHIFT_DB_ENV_POSTGRESQL_USER'],
    REDSHIFT_DB_ENV_POSTGRESQL_PASS: process.env['REDSHIFT_DB_ENV_POSTGRESQL_PASS'],
    REDSHIFT_DB_PORT_5432_TCP_ADDR: process.env['REDSHIFT_DB_PORT_5432_TCP_ADDR'],
    REDSHIFT_DB_PORT_5432_TCP_PORT: process.env['REDSHIFT_DB_PORT_5432_TCP_PORT'],
    REDSHIFT_IAM_ROLE: process.env['REDSHIFT_IAM_ROLE'],
    REDSHIFT_S3_BUCKET: process.env['REDSHIFT_S3_BUCKET'],
    STORAGE_REDIS_HOST: process.env['STORAGE_REDIS_HOST'],
    STORAGE_REDIS_PORT: process.env['STORAGE_REDIS_PORT'] || 6379,
    STORAGE_REDIS_DB_INDEX: process.env['STORAGE_REDIS_DB_INDEX'] || 0,
    ACS_JWT: process.env['ACS_JWT'] || 'jwt',
    ACS_CLIENT_SECRET: process.env['ACS_CLIENT_SECRET'] || 'secret',
    ACS_API_KEY: process.env['ACS_API_KEY'] || '',
    ACS_URL: process.env['ACS_URL'] || 'https://mc.adobe.io/cru/campaign/',
    SNS_TOPIC_ARN: process.env['SNS_TOPIC_ARN'] || '',
    AEM_URL: process.env['AEM_URL'] || 'http://localhost:4502',
    AEM_USERNAME: process.env['AEM_USERNAME'] || '',
    AEM_PASSWORD: process.env['AEM_PASSWORD'] || '',
    AEM_SNS_TOPIC_ARN: process.env['AEM_SNS_TOPIC_ARN'] || '',
    LOG_LEVEL: process.env['LOG_LEVEL'] || 'error'
  }
}
