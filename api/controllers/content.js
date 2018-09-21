'use strict'

const {forEach} = require('lodash')
const util = require('../util/util')
const Unscored = require('../../models/unscored')
const {Op} = require('sequelize')
const sequelize = require('../../config/sequelize')

const get = (request, response) => {
  let uri = util.sanitizeUri(request.query['uri'])
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

  const subQuery = sequelize().dialect.QueryGenerator.selectQuery('recently_scored', {attributes: ['uri']})
    .slice(0, -1) // to remove the ';' from the end of the SQL

  Unscored.findAndCountAll({
    where: {
      uri: {
        [Op.like]: uri + '%'
      },
      [Op.and]: [
        {
          uri: {
            [Op.notIn]: sequelize().literal('(' + subQuery + ')')
          }
        }
      ]
    },
    limit: perPage,
    offset: offset,
    order: [['uri', order]]
  }).then((results) => {
    let uris = []
    forEach(results.rows, (result) => {
      uris.push(result.uri)
    })
    response.json({ data: uris, meta: { total: results.count } })
  })
}

module.exports = { get: get }
