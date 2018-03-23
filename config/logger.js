'use strict'

const winston = require('winston')
const logger = new(winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      prettyPrint: true,
      // Silence logger during tests
      silent: process.env.NODE_ENV === 'test'
    })
  ]
})

module.exports = logger
