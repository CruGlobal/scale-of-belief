'use strict'

/**
 * Lambda handler to refresh the "unscored" materialized view.
 */
const sequelize = require('../config/sequelize')
const rollbar = require('../config/rollbar')

module.exports.handler = async (lambdaEvent) => {
  try {
    return await sequelize().query('REFRESH MATERIALIZED VIEW unscored')
  } catch (error) {
    rollbar.error('Error refreshing the materialized view: unscored: ' + error)
    throw error
  }
}
