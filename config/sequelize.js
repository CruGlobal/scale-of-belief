'use strict'

const Sequelize = require('sequelize')
const environment = process.env.NODE_ENV === 'test' ? 'test' : 'development'
const config = require('./database')[environment]
const {forEach} = require('lodash')
let database
let isClosing = false

const sequelize = () => {
  if (isClosing) {
    return
  }
  if (typeof database === 'undefined') {
    database = new Sequelize(config.database, config.username, config.password, config)
  }
  return database
}

const close = () => {
  isClosing = true
  return database.close().then(() => {
    database = undefined
    // Delete sequelize Models from require cache.
    // They internally cache sequelize object and need to be reloaded on warm start
    forEach(['../models/event', '../models/user', '../models/score'], value => {
      delete require.cache[require.resolve(value)]
    })
    isClosing = false
  })
}

sequelize.close = close

module.exports = sequelize
