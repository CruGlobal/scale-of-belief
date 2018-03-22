'use strict'

const sequelize = require('../config/sequelize')

module.exports = () => {
  // close database connections
  return sequelize.close()
}
