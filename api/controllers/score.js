'use strict'

const Score = require('../../models/score')

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
    response.json(
      {
        uri: 'string',
        score: {
          unaware: 0,
          curious: 0,
          follower: 0,
          guide: 0,
          confidence: 0
        }
      })
  }
}
