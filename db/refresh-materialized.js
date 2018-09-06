'use strict'

/**
 * Lambda handler to refresh the "unscored" materialized view.
 */
const sequelize = require('../../config/sequelize')
const rollbar = require('../config/rollbar')

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  sequelize.query('REFRESH MATERIALIZED VIEW unscored').then(() => {
    lambdaCallback(null, 'Successfully refreshed the materialized view: unscored')
  }).catch((error) => {
    lambdaCallback('Error refreshing the materialized view: unscored: ' + error)
  })
})
