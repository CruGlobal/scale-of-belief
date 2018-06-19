'use strict'

const Score = require('../../models/score')
const {Op} = require('sequelize')
const {forEach} = require('lodash')
const util = require('../util/util')

module.exports = {
  get: function (request, response) {
    var uriPrefix = util.sanitizeUri(request.query['uri'])
    let page = request.query['page']
    let perPage = request.query['per_page']
    let orderBy = request.query['order_by']
    let order = request.query['order']

    if (!util.isInt(page) || !util.isInt(perPage)) {
      page = 1
      perPage = 25
    }

    if (!orderBy) {
      orderBy = 'uri'
    }

    if (!order) {
      order = 'ASC'
    }

    const offset = (page - 1) * perPage

    Score.findAndCountAll({
      where: {
        uri: {
          [Op.like]: uriPrefix + '%'
        }
      },
      limit: perPage,
      offset: offset,
      order: [[orderBy, order]]
    }).then((scores) => {
      if (scores && scores.rows) {
        var transformedScores = []
        forEach(scores.rows, (score) => {
          transformedScores.push(Score.toApiScore(score))
        })
        response.json({ data: transformedScores, meta: { total: scores.count } })
      } else {
        response.json({ data: [], meta: { total: 0 } })
      }
    })
  }
}
