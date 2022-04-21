'use strict'

const buildUnauthorizedResponse = (response) => {
  response.status(401)
  response.json({
    message: 'Unauthorized'
  })
}

const buildUnauthorizedError = (error) => {
  error = new Error('You do not have access to this resource')
  error.status = 401
  return error
}

const buildInvalidApiKey = () => {
  const error = new Error('Unauthorized')
  error.status = 401
  return error
}

const buildInternalErrorResponse = (response) => {
  response.status(500)
  response.json({
    message: 'Internal Server Error'
  })
}

const sanitizeUri = (uri) => {
  // Remove query parameters
  uri = uri.split('?')[0].split('#')[0]

  // Remove quotes
  if (uri.includes('"')) {
    uri = uri.replace(/"/g, '')
  }
  return uri.toLowerCase()
}

const isInt = (value) => {
  if (isNaN(value)) {
    return false
  }
  const x = parseFloat(value)
  return (x | 0) === x
}

module.exports = {
  buildUnauthorizedResponse,
  buildUnauthorizedError,
  buildInvalidApiKey,
  buildInternalErrorResponse,
  sanitizeUri,
  isInt
}
