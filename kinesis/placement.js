'use strict'

const rollbar = require('../config/rollbar')
const logger = require('../config/logger')
const {forEach, chunk} = require('lodash')
const Placement = require('../models/placement')
const GlobalRegistry = require('../config/global-registry')

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  const sequelize = require('../config/sequelize')
  const {IdentityStitcher} = require('../models/identity-stitcher')
  const Event = require('../models/event')

  // Chunk event into 25 records and log
  forEach(chunk(lambdaEvent['Records'], 25), records => logger.info(JSON.stringify(records)))

  // Make sure we have event records
  if (typeof lambdaEvent['Records'] !== 'undefined') {
    // Keep track of all promises
    const completed = []

    // Iterate over each record
    lambdaEvent['Records'].forEach((record) => {
      const eventCompleted = new Promise((resolve) => {
        try {
          // Build an event object from each record, catch any resulting errors (InvalidEventError)
          const event = Event.fromRecord(record)

          // Stitch current event into known identities
          IdentityStitcher(event).then(user => {
            // IdentityStitcher returns a saved user, but we still need to save the event
            event.save().then(event => {
              // If the user has master_person identities, calculate placement
              if (user.has_gr_master_person_id) {
                new Placement(user).calculate().then(placement => {
                  // Update Global Registry
                  GlobalRegistry.updatePlacement(placement).then(() => {
                    // Resolve this event
                    resolve(event)
                  }, error => {
                    rollbar.error('GlobalRegistry.updatePlacement(placement) error', error)
                    resolve(error)
                  })
                }, error => {
                  rollbar.error('Placement(user).calculate() error', error)
                  resolve(error)
                })
              } else {
                // Resolve this event
                resolve(event)
              }
            }, error => {
              rollbar.error('event.save() error', error, {record: record})
              resolve(error)
            })
          }, error => {
            rollbar.error('IdentityStitcher(event) error', error, {record: record})
            resolve(error)
          })
        } catch (error) {
          if (!(error instanceof Event.BotEventError)) {
            rollbar.error('Event.fromRecord(record) error', error, {record: record})
          }
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
