'use strict'

const winston = require('winston')
const logger = new (winston.Logger)({
  level: process.env.LOG_LEVEL || 'debug',
  transports: [
    new (winston.transports.Console)({
      // Don't pretty print in AWS
      prettyPrint: !!process.env.AWS_EXECUTION_ENV,
      // Silence logger during tests
      silent: process.env.NODE_ENV === 'test'
    })
  ]
})

module.exports = logger
