'use strict'

const Sequelize = require('sequelize')
const environment = process.env.NODE_ENV === 'test' ? 'test' : 'development'
const config = require('./database')[environment]

module.exports = new Sequelize(config.database, config.username, config.password, config)
