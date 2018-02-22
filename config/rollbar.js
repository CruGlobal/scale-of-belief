'use strict'

const Rollbar = require('rollbar')
const {includes} = require('lodash')

const rollbar = new Rollbar({
  // https://rollbar.com/docs/notifier/rollbar.js/#configuration-reference
  accessToken: process.env['ROLLBAR_ACCESS_TOKEN'],
  // Enable rollbar on staging and production
  enabled: includes(['staging', 'production'], process.env['NODE_ENV']),
  payload: {
    environment: process.env['NODE_ENV']
  }
})

module.exports = rollbar
