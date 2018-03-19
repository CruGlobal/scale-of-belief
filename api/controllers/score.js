'use strict'

const Score = require('../../models/score')
const sequelize = require('../../config/sequelize')

const get = (request, response) => {
  var uri = request.query['uri'].toLowerCase()
  retrieveScore(uri).then((score) => {
    handleGetResponse(score, response)
  })
}

const post = (request, response) => {
  sequelize.transaction(function (t) {
    var requestBody = request.body
    var requestScore = requestBody.score
    return Score.upsert(
      {
        uri: requestBody.uri,
        unaware: requestScore.unaware,
        curious: requestScore.curious,
        follower: requestScore.follower,
        guide: requestScore.guide,
        confidence: requestScore.confidence
      },
      {
        returning: true
      }
    )
  }).then(function (result) {
    response.json(result[0].dataValues)
  })
}

const retrieveScore = (uri) => {
  return Score.findOne({
    where: {
      uri: uri
    }
  })
}

const handleGetResponse = (score, response) => {
  if (score) {
    response.json(score)
  } else {
    response.status(404)
    response.json({
      message: 'Not Found'
    })
  }
}

module.exports = {
  get: get,
  post: post,
  retrieveScore: retrieveScore,
  handleGetResponse: handleGetResponse
}
