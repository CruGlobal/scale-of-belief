'use strict'

const rollbar = require('../config/rollbar')
const logger = require('../config/logger')
const {forEach, chunk} = require('lodash')
const promiseRetry = require('promise-retry')

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
              event.replace().then(event => {
                resolve()
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
