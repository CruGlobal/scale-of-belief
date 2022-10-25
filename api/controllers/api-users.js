'use strict'

const ApiUser = require('../../models/api-user')
const util = require('../util/util')

module.exports = {
  get: (request, response) => {
    let page = request.query.page
    let perPage = request.query.per_page
    let orderBy = request.query.order_by
    let order = request.query.order

    if (!util.isInt(page) || !util.isInt(perPage)) {
      page = 1
      perPage = 25
    }

    if (!orderBy) {
      orderBy = 'guid'
    }

    if (!order) {
      order = 'ASC'
    }

    const offset = (page - 1) * perPage

    ApiUser.findAndCountAll({
      limit: perPage,
      offset,
      order: [[orderBy, order]]
    }).then((users) => {
      response.json({
        data: users.rows,
        meta: {
          total: users.count
        }
      })
    })
  }
}
