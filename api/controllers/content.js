'use strict'

const sequelize = require('../../config/sequelize')
const {forEach} = require('lodash')
const util = require('../util/util')

const get = (request, response) => {
  var uri = util.sanitizeUri(request.query['uri'])
  let page = request.query['page']
  let perPage = request.query['per_page']

  if (!isInt(page) || !isInt(perPage)) {
    page = 1
    perPage = 25
  }

  const offset = (page - 1) * perPage

  sequelize().query(
    'SELECT events.uri ' +
    'FROM events LEFT JOIN scores USING (uri) ' +
    'WHERE scores.uri IS NULL AND events.uri LIKE(:uri) ' +
    'ORDER BY events.uri ' +
    'LIMIT :perPage OFFSET :offset',
    {
      replacements: { uri: uri + '%', perPage: perPage, offset: offset },
      type: sequelize().QueryTypes.SELECT
    }
  ).then((results) => {
    var uris = []
    forEach(results, (result) => {
      uris.push(result.uri)
    })
    response.json(uris)
  })
}

const isInt = (value) => {
  let x
  if (isNaN(value)) {
    return false
  }
  x = parseFloat(value)
  return (x | 0) === x
}

module.exports = { get: get }
