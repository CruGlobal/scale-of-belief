'use strict'

const ApiUser = require('../../models/api-user')

module.exports = {
  get: (request, response) => {
    ApiUser.findAll().then((users) => {
      response.json(users)
    })
  }
}
