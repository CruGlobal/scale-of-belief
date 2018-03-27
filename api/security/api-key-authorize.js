'use strict'

const ApiKey = require('../../models/api-key')
const {find} = require('lodash')
const logger = require('../../config/logger')
const util = require('../util/util')

module.exports = function authorize (request, response, next) {
  validate(request, function (error, availableScopes) {
    if (!error) {
      if (!availableScopes || !availableScopes.length) {
        next(util.buildUnauthorizedError(error))
      } else {
        var requestedResource

        if (request.method === 'GET') {
          requestedResource = request.query['uri']
        } else {
          requestedResource = request.body['uri']
        }
        if (isAuthorized(availableScopes, requestedResource)) {
          next()
        } else {
          next(util.buildUnauthorizedError(error))
        }
      }
    } else {
      next(error)
    }
  })
}

function isAuthorized (availableScopes, requestedResource) {
  requestedResource = requestedResource.toLowerCase()
  var authorized = false

  if (Array.isArray(availableScopes)) {
    authorized = find(availableScopes, function (scope) {
      return requestedResource.match(scope)
    })
  } else {
    if (requestedResource.match(availableScopes)) {
      authorized = true
    }
  }

  return authorized
}

function validate (request, callback) {
  var auth = request.headers['x-api-key'] // header comes in all lowercase

  if (!auth) {
    callback(util.buildInvalidApiKey(), [])
  } else {
    determineScopes(auth, callback)
  }
}

function determineScopes (auth, callback) {
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
        callback(util.buildInvalidApiKey(), [])
      }
    }).catch(function (error) {
      logger.error(error)
      callback(util.buildInvalidApiKey(), [])
    })
}
