'use strict'

module.exports = function authorize (request, response, next) {
  validate (request, function (error, availableScopes) {
    next()
  })
}

function validate(request, callback) {
  var auth = request.headers['x-api-key'] // header comes in all lowercase

  if (!auth) {
    callback(null, [])
    return
  }

  callback(null, ['somewhere'])
}