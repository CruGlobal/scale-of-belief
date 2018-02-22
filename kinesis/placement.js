'use strict'

const {Event, sequelize} = require('../models/db/index')
const {IdentityStitcher} = require('../models/identity-stitcher')
const rollbar = require('../config/rollbar')

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  const completed = []
  if (typeof lambdaEvent['Records'] !== 'undefined') {
    lambdaEvent['Records'].forEach((record) => {
      const eventCompleted = new Promise((resolve) => {
        const event = Event.fromRecord(record)
        IdentityStitcher(event).then(user => {
          resolve()
          // event.user_id = user.id
          // event.save().then(event => {
          //   // Calculate placement
          //   resolve()
          // }, error => {
          //   resolve()
          // })
        }, error => {
          resolve(error)
        })
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
