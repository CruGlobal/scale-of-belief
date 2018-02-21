'use strict'

const {sequelize} = require('./factories')
const {forEach} = require('lodash')

module.exports = () => {
  // Destroy all Model instances (wipe the database)
  const destroyed = []
  forEach(sequelize.models, (value) => {
    destroyed.push(value.destroy({truncate: true}))
  })
  return Promise.all(destroyed)
}
