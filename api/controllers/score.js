'use strict'

const Score = require('../../models/score')
const sequelize = require('../../config/sequelize')

module.exports = {
  get: function (request, response) {
    var uri = request.query['uri'].toLowerCase()
    Score.findOne({
      where: {
        uri: uri
      }
    }).then((score) => {
      if (score) {
        response.json(score)
      } else {
        response.status(404)
        response.json({
          message: 'Not Found'
        })
      }
    })
  },

  post: function (request, response) {
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
}
