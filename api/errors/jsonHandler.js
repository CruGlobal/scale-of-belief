'use strict'

const logger = require('../../config/logger')

const jsonErrorHandler = function (error, request, response, next) {
  if (response.headersSent) {
    return next(error)
  }

  logger.debug(error)
  response
    .status(error.status)
    .send({message: error.message})
}

module.exports = jsonErrorHandler
