'use strict'

/**
 * Lambda handler to refresh the "unscored" materialized view.
 */
const sequelize = require('../config/sequelize')
const rollbar = require('../config/rollbar')
const RecentlyScored = require('../models/recently-scored')

module.exports.handler = async (lambdaEvent) => {
  try {
    await sequelize().query('REFRESH MATERIALIZED VIEW unscored')
    return await RecentlyScored.destroy({truncate: true})
  } catch (error) {
    rollbar.error('Error refreshing the materialized view: unscored: ' + error, error)
    throw error
  }
}
