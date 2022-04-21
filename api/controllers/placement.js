'use strict'

const User = require('../../models/user')
const Placement = require('../../models/placement')
const { Op } = require('sequelize')
const { identity, isEmpty, mapValues, pickBy } = require('lodash')

const get = (request, response) => {
  const params = mapValues(pickBy(request.query, identity), (value) => {
    return { [Op.contains]: [value] }
  })

  if (isEmpty(params)) {
    response.status(400)
    response.json({
      message: 'Requires at least on query parameter.'
    })
    return
  }

  User.findAll({ where: params, attributes: ['id'] }).then(users => {
    if (isEmpty(users)) {
      response.status(404)
      response.json({
        message: 'Not Found'
      })
    } else {
      new Placement(users[0]).calculate().then(placement => {
        response.json({ placement: placement.placement })
      }, error => {
        response.status(400)
        response.json({
          message: error.message
        })
      })
    }
  }, error => {
    response.status(400)
    response.json({
      message: error.message
    })
  })
}

module.exports = {
  get
}
