'use strict'

const ApiUser = require('../../models/api-user')
const util = require('../util/util')

const get = (request, response) => {
  const guid = util.sanitizeUri(request.query['guid'])
  ApiUser.retrieve(guid).then((user) => {
    if (user) {
      response.json(user)
    } else {
      response.status(404)
      response.json({
        message: 'Not Found'
      })
    }
  })
}

const post = (request, response) => {
  const requestBody = request.body
  ApiUser.save(requestBody).then(() => {
    response.json(requestBody)
  })
}

module.exports = {
  get: get,
  post: post
}
