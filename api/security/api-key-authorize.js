'use strict'

module.exports = function authorize (request, response, next) {
  validate (request, function (error, availableScopes) {
    if (!error) {
      if (!availableScopes.length) {
        next(buildUnauthorized(error))
      } else {
        next()
      }
    } else {
      next(error)
    }
  })
}

function buildUnauthorized(error) {
  error = new Error('You do not have access to this resource')
  error.status = 401
  return error
}

function validate(request, callback) {
  var auth = request.headers['x-api-key'] // header comes in all lowercase

  if (!auth) {
    var error = new Error('Unauthorized')
    error.status = 401
    callback(error, [])
    return
  }

  callback(null, ['somewhere'])
}