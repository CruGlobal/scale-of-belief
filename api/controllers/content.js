'use strict'

const sequelize = require('../../config/sequelize')
const {forEach} = require('lodash')
const util = require('../util/util')

const get = (request, response) => {
  var uri = util.sanitizeUri(request.query['uri'])
  sequelize().query(
    'SELECT events.uri FROM events LEFT JOIN scores USING (uri) WHERE scores.uri IS NULL AND events.uri LIKE(:uri)',
    {
      replacements: { uri: uri + '%' },
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

module.exports = { get: get }
