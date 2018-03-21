'use strict'

const path = require('path')
const sequelize = require('../config/sequelize')
const Umzug = require('umzug')
const rollbar = require('../config/rollbar')

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  const umzug = new Umzug({
    storage: 'sequelize',
    storageOptions: {
      sequelize: sequelize
    },
    migrations: {
      params: [sequelize.getQueryInterface(), sequelize.constructor],
      // params: [sequelize.getQueryInterface(), sequelize.constructor, function () {
      //   throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.')
      // }],
      path: path.join(__dirname, 'migrate'),
      pattern: /\.js$/
    }
  })
  umzug.up().then(() => {
    sequelize.close()
    lambdaCallback(null, 'Migrations successful')
  }, (err) => {
    sequelize.close()
    lambdaCallback('Error running migrations: ' + err.toString())
  })
})
