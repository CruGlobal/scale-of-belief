'use strict'

const {ApiKey} = require('../../models/db')
const {forEach} = require('lodash')

module.exports = function authorize (request, response, next) {
  validate (request, function (error, availableScopes) {
    if (!error) {
      if (!availableScopes || !availableScopes.length) {
        next(buildUnauthorized(error))
      } else {
        var requestedResource = request.query['uri']

        if (isAuthorized(availableScopes, requestedResource)) {
          next()
        } else {
          next(buildUnauthorized(error))
        }
      }
    } else {
      next(error)
    }
  })
}

function isAuthorized(availableScopes, requestedResource) {
  var authorized = false

  if (Array.isArray(availableScopes)) {
    forEach(availableScopes, (scope) => {
      if (requestedResource.match(scope)) {
        authorized = true
      }
    })
  } else {
    if (requestedResource.match(availableScopes)) {
      authorized = true
    }
  }

  return authorized
}

function buildUnauthorized(error) {
  error = new Error('You do not have access to this resource')
  error.status = 401
  return error
}

function validate(request, callback) {
  var auth = request.headers['x-api-key'] // header comes in all lowercase

  if (!auth) {
    callback(buildInvalidApiKey(), [])
    return
  } else {
    determineScopes(auth, callback)
  }
}

function determineScopes(auth, callback) {
  ApiKey.findOne(
    {
      where: {
        api_key: auth
      }
    }).then((dbApiKey) => {
      if (dbApiKey) {
        var apiPatterns = dbApiKey.api_pattern
        callback(null, apiPatterns)
      } else {
        callback(buildInvalidApiKey(), [])
      }
    }).catch(function (error) {
      console.log(error)
      callback(buildInvalidApiKey(), [])
    })
}

function buildInvalidApiKey() {
  var error = new Error('Unauthorized')
  error.status = 401
  return error
}