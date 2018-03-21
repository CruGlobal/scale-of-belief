'use strict'

require('dotenv').config()
const {assign} = require('lodash')
const defaults = {
  dialect: 'postgres',
  username: process.env.DB_ENV_POSTGRESQL_USER,
  password: process.env.DB_ENV_POSTGRESQL_PASS,
  database: process.env.DB_ENV_POSTGRESQL_DB,
  host: process.env.DB_PORT_5432_TCP_ADDR || 'localhost',
  port: process.env.DB_PORT_5432_TCP_PORT || 5432,
  // Disable operator aliases, we don't use them (also disables deprecation warning).
  operatorsAliases: false
}

module.exports = {
  development: defaults,
  test: assign({}, defaults, {
    database: `${process.env.DB_ENV_POSTGRESQL_DB}_test`,
    logging: false
  })
}
