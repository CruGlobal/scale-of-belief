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
  var requestBody = request.body
  saveScore(requestBody.uri, requestBody.score).then(function (result) {
    response.json(Score.toApiScore(result[0].dataValues))
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
    response.json(Score.toApiScore(score))
  } else {
    response.status(404)
    response.json({
      message: 'Not Found'
    })
  }
}

const saveScore = (uri, score) => {
  return sequelize.transaction(function (t) {
    return Score.upsert(
      {
        uri: uri,
        unaware: score.unaware,
        curious: score.curious,
        follower: score.follower,
        guide: score.guide,
        confidence: score.confidence
      },
      {
        returning: true
      }
    )
  })
}

module.exports = {
  get: get,
  post: post,
  retrieveScore: retrieveScore,
  handleGetResponse: handleGetResponse,
  saveScore: saveScore
}
