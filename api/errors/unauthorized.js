'use strict'

const unauthorizedErrorHandler = function (error, request, response, next) {
  if (response.headersSent || error.status !== 401) {
    return next(error)
  }

  console.error(error.stack)
  response
    .status(401)
    .send({message: error.message})
}

module.exports = unauthorizedErrorHandler
