'use strict'

const Rollbar = require('rollbar')
const {includes} = require('lodash')

const rollbar = new Rollbar({
  // https://rollbar.com/docs/notifier/rollbar.js/#configuration-reference
  accessToken: process.env['ROLLBAR_ACCESS_TOKEN'],
  // Enable rollbar on staging and production
  enabled: includes(['staging', 'production'], process.env['ENVIRONMENT']),
  payload: {
    environment: process.env['ENVIRONMENT']
  }
})

module.exports = rollbar
