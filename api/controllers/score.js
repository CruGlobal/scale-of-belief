'use strict'

const Score = require('../../models/score')
const sequelize = require('../../config/sequelize')

const get = (request, response) => {
  var uri = request.query['uri'].toLowerCase()
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
  saveScore(requestBody.uri, requestBody.score).then(function (result) {
    response.json(Score.toApiScore(result[0].dataValues))
  })
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
  saveScore: saveScore
}
