'use strict'

const sequelize = require('../config/sequelize')
const {forEach} = require('lodash')

module.exports = () => {
  // Destroy all Model instances (wipe the database) then close database connections
  const destroyed = []
  forEach(sequelize.models || [], (value) => {
    destroyed.push(value.destroy({truncate: true}))
  })
  return Promise.all(destroyed).then(() => sequelize.close())
}
