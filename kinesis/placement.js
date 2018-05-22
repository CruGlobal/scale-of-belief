'use strict'

const rollbar = require('../config/rollbar')
const logger = require('../config/logger')
const {forEach, chunk} = require('lodash')

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  const sequelize = require('../config/sequelize')
  const {IdentityStitcher} = require('../models/identity-stitcher')
  const Event = require('../models/event')

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
              logger.error('event.save() => ' + JSON.stringify(error))
              logger.error(error.toString())
              resolve(error)
            })
          }, error => {
            logger.error('IdentityStitcher(event) => ' + JSON.stringify(error))
            resolve(error)
          })
        } catch (error) {
          logger.error('Event.fromRecord(record) => ' + JSON.stringify(error))
          resolve(error)
        }
      })
      completed.push(eventCompleted)
    })

    Promise.all(completed).then((results) => {
      sequelize.close().then(() => {
        lambdaCallback(null, `Successfully processed ${results.length} events.`)
      })
    })
  } else {
    lambdaCallback(null, 'Nothing processed')
  }
})
