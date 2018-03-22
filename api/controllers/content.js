'use strict'

const sequelize = require('../../config/sequelize')
const {forEach} = require('lodash')

const get = (request, response) => {
  var uri = removeQueryParameters(request.query['uri'].toLowerCase())
  sequelize.query(
    'SELECT events.uri FROM events LEFT JOIN scores USING (uri) WHERE scores.uri IS NULL AND events.uri LIKE(\'' + uri + '%\')',
    {
      type: sequelize.QueryTypes.SELECT
    }
  ).then((results) => {
    var uris = []
    forEach(results, (result) => {
      uris.push(result.uri)
    })
    response.json(uris)
  })
}

const removeQueryParameters = (uri) => {
  return uri.split('?')[0].split('#')[0]
}

module.exports = { get: get }
