'use strict'

const Score = require('../../models/score')
const {Op} = require('sequelize')
const {forEach} = require('lodash')
const util = require('../util/util')

module.exports = {
  get: function (request, response) {
    var uriPrefix = util.sanitizeUri(request.query['uri'])
    Score.findAll({
      where: {
        uri: {
          [Op.like]: uriPrefix + '%'
        }
      }
    }).then((scores) => {
      if (scores && scores.length > 0) {
        var transformedScores = []
        forEach(scores, (score) => {
          transformedScores.push(Score.toApiScore(score))
        })
        response.json(transformedScores)
      } else {
        response.status(404)
        response.json({
          message: 'Not Found'
        })
      }
    })
  }
}
