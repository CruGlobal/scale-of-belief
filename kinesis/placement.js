'use strict'

const sequelize = require('../config/sequelize')
const Event = require('../models/event')
const {IdentityStitcher} = require('../models/identity-stitcher')
const rollbar = require('../config/rollbar')
const logger = require('../config/logger')

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  const completed = []
  if (typeof lambdaEvent['Records'] !== 'undefined') {
    lambdaEvent['Records'].forEach((record) => {
      logger.debug(record)
      const eventCompleted = new Promise((resolve) => {
        try {
          const event = Event.fromRecord(record)
          IdentityStitcher(event).then(user => {
            event.save().then(event => {
              resolve()
            }, error => {
              resolve(error)
            })
          }, error => {
            resolve(error)
          })
        } catch (e) {
          logger.error(e)
          resolve(e)
        }
      })
      completed.push(eventCompleted)
    })

    Promise.all(completed).then((results) => {
      // Close database connections if invoked locally
      if (process.env.IS_LOCAL) {
        sequelize.close()
      }
      lambdaCallback(null, `Successfully processed ${results.length} events.`)
    })
  } else {
    lambdaCallback(null, 'Nothing processed')
  }
})
