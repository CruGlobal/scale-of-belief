'use strict'

const Score = require('../../models/score')

const get = (request, response) => {
  var uri = removeQueryParameters(request.query['uri'].toLowerCase())
  Score.retrieve(uri).then((score) => {
    if (score) {
      response.json(Score.toApiScore(score))
    } else {
      response.status(404)
      response.json({
        message: 'Not Found'
      })
    }
  })
}

const post = (request, response) => {
  var requestBody = request.body
  Score.save(removeQueryParameters(requestBody.uri), requestBody.score).then(function (result) {
    response.json(Score.toApiScore(result[0].dataValues))
  })
}

const removeQueryParameters = (uri) => {
  return uri.split('?')[0].split('#')[0]
}

module.exports = {
  get: get,
  post: post
}
