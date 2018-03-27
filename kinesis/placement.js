'use strict'

const sequelize = require('../config/sequelize')
const Event = require('../models/event')
const {IdentityStitcher} = require('../models/identity-stitcher')
const rollbar = require('../config/rollbar')
const logger = require('../config/logger')
const {forEach, chunk} = require('lodash')

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  // Don't wait for the event loop to end before exiting
  lambdaContext.callbackWaitsForEmptyEventLoop = false

  // Chunk event into 25 records and log
  forEach(chunk(lambdaEvent['Records'], 25), records => logger.info(JSON.stringify(records)))

  const completed = []
  if (typeof lambdaEvent['Records'] !== 'undefined') {
    lambdaEvent['Records'].forEach((record) => {
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
          logger.error(JSON.stringify(e))
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
