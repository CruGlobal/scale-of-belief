'use strict'

require('dotenv').config()
const { assign } = require('lodash')
const logger = require('./logger')
const defaults = {
  dialect: 'postgres',
  username: process.env.DB_ENV_POSTGRESQL_USER,
  password: process.env.DB_ENV_POSTGRESQL_PASS,
  database: process.env.DB_ENV_POSTGRESQL_DB,
  host: process.env.DB_PORT_5432_TCP_ADDR || 'localhost',
  port: process.env.DB_PORT_5432_TCP_PORT || 5432,
  // Disable operator aliases, we don't use them (also disables deprecation warning).
  operatorsAliases: false,
  // Use logger for logging at debug level, only if DEBUG env is set
  logging: (msg) => { if (process.env.DEBUG === '*') logger.debug(msg) },
  pool: {
    max: 10,
    idle: 500,
    acquire: 60000
  }
}

module.exports = {
  development: defaults,
  test: assign({}, defaults, {
    database: `${process.env.DB_ENV_POSTGRESQL_DB}_test`,
    logging: false
  })
}
