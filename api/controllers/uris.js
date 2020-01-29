'use strict'

const {forEach} = require('lodash')
const util = require('../util/util')
const Unscored = require('../../models/unscored')
const Score = require('../../models/score')

const get = (request, response) => {
  let page = request.query['page']
  let perPage = request.query['per_page']
  let order = request.query['order']

  if (!util.isInt(page) || !util.isInt(perPage)) {
    page = 1
    perPage = 25
  }

  if (!order) {
    order = 'ASC'
  }

  const offset = (page - 1) * perPage

  let urisList = []
  Unscored.findAndCountAll({
    limit: perPage,
    offset: offset,
    order: [['uri', order]]
  }).then((results) => {
    forEach(results.rows, (result) => {
      urisList.push(Score.toUnscored(result.uri))
    })
  })

  Score.findAndCountAll({
    limit: perPage,
    offset: offset,
    order: [['uri', order]]
  }).then((scores) => {
    forEach(scores.rows, (score) => {
      urisList.push(Score.toUriScore(score))
    })
    response.json({ data: urisList, meta: { total: scores.count } })
  })
}

module.exports = { get: get }
