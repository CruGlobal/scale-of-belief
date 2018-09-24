'use strict'

const Score = require('../../models/score')
const RecentlyScored = require('../../models/recently-scored')
const util = require('../util/util')
const {pick} = require('lodash')

const get = (request, response) => {
  var uri = util.sanitizeUri(request.query['uri'])
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
  const sanitizedUri = util.sanitizeUri(requestBody.uri)

  Score.save(sanitizedUri, pick(requestBody, ['score', 'weight'])).then(function (result) {
    // This can be asynchronous
    RecentlyScored.save(sanitizedUri, requestBody.score)

    // On update, we will have a multi-dimensional array (first element being the version), on create we won't
    if (Array.isArray(result)) {
      response.json(Score.toApiScore(result[1][0].dataValues))
    } else {
      response.json(Score.toApiScore(result.dataValues))
    }
  })
}

module.exports = {
  get: get,
  post: post
}
