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
    GLOBAL_REGISTRY_TOKEN: process.env['GLOBAL_REGISTRY_TOKEN'] || 'secret'
  }
}
