'use strict'

const ApiUser = require('../../models/api-user')
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
  if (!request.user || !request.user.guid) {
    callback(util.buildInvalidApiKey(), [])
  } else {
    determineScopes(request.user.guid, callback)
  }
}

function determineScopes (auth, callback) {
  ApiUser.findOne(
    {
      where: {
        guid: auth
      }
    }).then((dbApiUser) => {
      if (dbApiUser) {
        var apiPatterns = dbApiUser.api_pattern
        callback(null, apiPatterns)
      } else {
        callback(util.buildInvalidApiKey(), [])
      }
    }).catch(function (error) {
      logger.error(error)
      callback(util.buildInvalidApiKey(), [])
    })
}
