'use strict'

const {sequelize} = require('./factories')

module.exports = () => {
  // Close any remaining database connections
  return sequelize.close()
}
