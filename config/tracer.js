'use strict'

const logger = require('./logger')
const tracer = require('dd-trace').init({
  service: 'scale_of_belief',
  env: process.env['ENVIRONMENT'],
  debug: process.env['DEBUG'] === '*',
  logger: {
    debug: message => logger.debug(message),
    error: err => logger.error(err)
  }
})

module.exports = tracer
