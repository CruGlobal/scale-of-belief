'use strict'

const jsonErrorHandler = function (error, request, response, next) {
  if (response.headersSent) {
    return next(error)
  }

  console.error(error.stack)
  response
    .status(error.status)
    .send({message: error.message})
}

module.exports = jsonErrorHandler
