'use strict'

const User = require('../../models/user')
const Placement = require('../../models/placement')
const {Op} = require('sequelize')
const {identity, isEmpty, isNull, mapValues, pickBy} = require('lodash')

const get = (request, response) => {
  let params = mapValues(pickBy(request.query, identity), (value) => {
    return {[Op.contains]: [value]}
  })

  if (isEmpty(params)) {
    response.status(400)
    response.json({
      message: 'Requires at least on query parameter.'
    })
    return
  }

  User.findOne({where: params}).then(user => {
    if (isNull(user)) {
      response.status(404)
      response.json({
        message: 'Not Found'
      })
    } else {
      new Placement(user).calculate().then(placement => {
        response.json({placement: placement.placement})
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
  get: get
}
