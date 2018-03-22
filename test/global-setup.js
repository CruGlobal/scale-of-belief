'use strict'

const {forEach} = require('lodash')
const User = require('../models/user')
const Event = require('../models/event')
const Score = require('../models/score')
const ApiKey = require('../models/api-key')

module.exports = () => {
  // Destroy all Model instances (wipe the database)
  const models = [User, Event, Score, ApiKey]
  const destroyed = []
  forEach(models, (value) => {
    destroyed.push(value.destroy({truncate: true}))
  })
  return Promise.all(destroyed)
}
