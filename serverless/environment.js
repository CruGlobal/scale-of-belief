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
    REDSHIFT_DB_ENV_POSTGRESQL_DB: process.env['REDSHIFT_DB_ENV_POSTGRESQL_DB'],
    REDSHIFT_DB_ENV_POSTGRESQL_USER: process.env['REDSHIFT_DB_ENV_POSTGRESQL_USER'],
    REDSHIFT_DB_ENV_POSTGRESQL_PASS: process.env['REDSHIFT_DB_ENV_POSTGRESQL_PASS'],
    REDSHIFT_DB_PORT_5432_TCP_ADDR: process.env['REDSHIFT_DB_PORT_5432_TCP_ADDR'],
    REDSHIFT_DB_PORT_5432_TCP_PORT: process.env['REDSHIFT_DB_PORT_5432_TCP_PORT'],
    REDSHIFT_IAM_ROLE: process.env['REDSHIFT_IAM_ROLE'],
    REDSHIFT_S3_BUCKET: process.env['REDSHIFT_S3_BUCKET'],
    REDIS_PORT_6379_TCP_ADDR: process.env['REDIS_PORT_6379_TCP_ADDR'],
    REDIS_PORT_6379_TCP_ADDR_PORT: process.env['REDIS_PORT_6379_TCP_ADDR_PORT'] || 6379
  }
}
