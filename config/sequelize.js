'use strict'

const Sequelize = require('sequelize')
const environment = process.env.NODE_ENV === 'test' ? 'test' : 'development'
const config = require('./database')[environment]
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
    isClosing = false
  })
}

sequelize.close = close

module.exports = sequelize
