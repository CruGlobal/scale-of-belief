'use strict'

module.exports = () => {
  require('dotenv').config()
  return {
    DB_ENV_POSTGRESQL_DB: process.env['DB_ENV_POSTGRESQL_DB'] || 'scale_of_belief',
    DB_ENV_POSTGRESQL_USER: process.env['DB_ENV_POSTGRESQL_USER'] || 'scale_of_belief',
    DB_ENV_POSTGRESQL_PASS: process.env['DB_ENV_POSTGRESQL_PASS'] || '',
    DB_PORT_5432_TCP_ADDR: process.env['DB_PORT_5432_TCP_ADDR'] || 'localhost',
    DB_PORT_5432_TCP_PORT: process.env['DB_PORT_5432_TCP_PORT'] || 5432
  }
}
