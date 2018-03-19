'use strict'

const Score = require('../../models/score')
const {Op} = require('sequelize')

module.exports = {
  get: function (request, response) {
    var uriPrefix = request.query['uri'].toLowerCase()
    Score.findAll({
      where: {
        uri: {
          [Op.like]: uriPrefix + '%'
        }
      }
    }).then((scores) => {
      if (scores && scores.length > 0) {
        response.json(scores)
      } else {
        response.status(404)
        response.json({
          message: 'Not Found'
        })
      }
    })
  }
}
