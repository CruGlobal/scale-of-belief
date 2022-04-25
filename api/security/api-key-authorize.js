'use strict'

const ApiKey = require('../../models/api-key')
const { find } = require('lodash')
const logger = require('../../config/logger')
const util = require('../util/util')

module.exports = function authorize (request, response, next) {
  validate(request, function (error, availableScopes, isSuperAdmin) {
    if (!error) {
      if (isSuperAdmin) {
        next()
        return
      }

      // Allow placement requests regardless of apiPatterns
      if (request.route.path === '/api/placement') {
        next()
        return
      }

      if (!availableScopes || !availableScopes.length) {
        next(util.buildUnauthorizedError(error))
      } else {
        let requestedResource

        if (request.method === 'GET') {
          requestedResource = request.query.uri
        } else {
          requestedResource = request.body.uri
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
  let authorized = false

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
  const auth = request.headers['x-api-key'] // header comes in all lowercase

  if (!auth) {
    callback(util.buildInvalidApiKey(), [])
  } else {
    determineScopesAndType(auth).then(values => {
      callback(null, values.apiPatterns, values.isSuperAdmin)
    }).catch(() => {
      callback(util.buildInvalidApiKey(), [], false)
    })
  }
}

function determineScopesAndType (auth) {
  return new Promise((resolve, reject) => {
    ApiKey.findOne(
      {
        where: {
          api_key: auth
        }
      }).then((dbApiKey) => {
      if (dbApiKey) {
        resolve({
          apiPatterns: dbApiKey.api_pattern,
          isSuperAdmin: dbApiKey.type === 'super'
        })
      } else {
        reject(new Error('API Key not found'))
      }
    }).catch(function (error) {
      logger.error(error)
      reject(error)
    })
  })
}
