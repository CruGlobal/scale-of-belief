'use strict'

const Rollbar = require('rollbar')
const logger = require('./logger')
const {includes} = require('lodash')
const proxyMap = {critical: 'crit', error: 'error', warning: 'warning', info: 'info', debug: 'debug'}

const rollbar = new Rollbar({
  // https://rollbar.com/docs/notifier/rollbar.js/#configuration-reference
  accessToken: process.env['ROLLBAR_ACCESS_TOKEN'],
  // Enable rollbar on staging and production
  enabled: includes(['staging', 'production'], process.env['ENVIRONMENT']),
  payload: {
    environment: process.env['ENVIRONMENT']
  }
})

// Proxy specific methods to logger before sending to rollbar
module.exports = new Proxy(rollbar, {
  get: function (obj, prop) {
    if (prop in proxyMap) {
      const origFunc = obj[prop]
      return function (...args) {
        logger[proxyMap[prop]].apply(this, args)
        return origFunc.apply(this, args)
      }
    }
    return obj[prop]
  }
})
