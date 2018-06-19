'use strict'

const sequelize = require('../../config/sequelize')
const {forEach} = require('lodash')
const util = require('../util/util')

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

  let baseQuery =
    'SELECT DISTINCT events.uri ' +
    'FROM events LEFT JOIN scores USING (uri) ' +
    'WHERE scores.uri IS NULL AND events.uri LIKE(:uri)'

  let count

  sequelize().query('SELECT COUNT(a.*) FROM (' + baseQuery + ') AS a',
    {
      replacements: { uri: uri + '%', perPage: perPage + 1, offset: offset },
      type: sequelize().QueryTypes.SELECT
    }
  ).then((results) => {
    count = results[0].count

    sequelize().query(
      baseQuery +
      ' ORDER BY events.uri ' + order +
      ' LIMIT :perPage OFFSET :offset',
      {
        replacements: { uri: uri + '%', perPage: perPage, offset: offset },
        type: sequelize().QueryTypes.SELECT
      }
    ).then((results) => {
      let uris = []
      forEach(results, (result) => {
        uris.push(result.uri)
      })
      response.json({ data: uris, meta: { total: count }})
    })
  })
}

module.exports = { get: get }
