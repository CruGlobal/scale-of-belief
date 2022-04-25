'use strict'

const { forEach } = require('lodash')
const util = require('../util/util')
const Unscored = require('../../models/unscored')
const { Op } = require('sequelize')

const get = (request, response) => {
  const uri = util.sanitizeUri(request.query.uri)
  let page = request.query.page
  let perPage = request.query.per_page
  let order = request.query.order

  if (!util.isInt(page) || !util.isInt(perPage)) {
    page = 1
    perPage = 25
  }

  if (!order) {
    order = 'ASC'
  }

  const offset = (page - 1) * perPage

  Unscored.findAndCountAll({
    where: {
      uri: {
        [Op.like]: uri + '%'
      }
    },
    limit: perPage,
    offset,
    order: [['uri', order]]
  }).then((results) => {
    const uris = []
    forEach(results.rows, (result) => {
      uris.push(result.uri)
    })
    response.json({ data: uris, meta: { total: results.count } })
  })
}

module.exports = { get }
