'use strict'

const rollbar = require('../config/rollbar')
const logger = require('../config/logger')
const {forEach, chunk} = require('lodash')
const Placement = require('../models/placement')
// const GlobalRegistry = require('../config/global-registry')
const promiseRetry = require('promise-retry')
const AWS = require('aws-sdk')

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  const sequelize = require('../config/sequelize')
  const {IdentityStitcher, UnknownUserError, KnownTestUserError} = require('../models/identity-stitcher')
  const Event = require('../models/event')
  const DerivedEvent = require('../models/derived-event')

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
          Event.findOne({where: {event_id: event.event_id}}).then(existing => {
            if (existing !== null) {
              // Event with event_id already exists in the database, ignore it and resolve
              resolve(event)
            } else {
              // Stitch current event into known identities, retrying on deadlock
              promiseRetry((retry, number) => {
                return IdentityStitcher(event)
                  .catch(error => {
                    if (error.message === 'deadlock detected') {
                      retry(error)
                    } else {
                      throw error
                    }
                  })
              }, {retries: 3, minTimeout: 100})
                .then(user => {
                  // IdentityStitcher returns a saved user, but we still need to save the event
                  event.replace().then(event => {
                    // If the user has master_person identities and current event is scored, calculate placement
                    if (user.has_gr_master_person_id) {
                      event.isScored().then(isScored => {
                        if (isScored) {
                          new Placement(user).calculate().then(placement => {
                            const sns = new AWS.SNS({ region: 'us-east-1' })
                            const payload = {
                              placement: placement.placement,
                              grMasterPersonIds: user.gr_master_person_id
                            }
                            const params = {
                              Message: JSON.stringify(payload),
                              TopicArn: process.env.SNS_TOPIC_ARN
                            }

                            sns.publish(params, (error, data) => {
                              if (error) {
                                rollbar.error(error, error.stack)
                                resolve(error)
                              }
                              if (data) {
                                resolve(event)
                              }
                            })
                          })
                        } else {
                          // Event isn't scored, resolve it
                          resolve(event)
                        }
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
                  if (!(error instanceof UnknownUserError || error instanceof KnownTestUserError)) {
                    rollbar.error('IdentityStitcher(event) error', error, {record: record})
                  }
                  resolve(error)
                })
            }
          })
        } catch (error) {
          if (!(error instanceof DerivedEvent.InvalidDerivedEventError)) {
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
