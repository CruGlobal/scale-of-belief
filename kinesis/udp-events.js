'use strict'

const rollbar = require('../config/rollbar')
const AWS = require('aws-sdk')

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  const Event = require('../models/event')
  const DerivedEvent = require('../models/derived-event')

  // Make sure we have event records
  if (typeof lambdaEvent['Records'] !== 'undefined') {
    const validEvents = []
    // Iterate over each record
    lambdaEvent['Records'].forEach((record) => {
      try {
        // Build an event object from each record, catch any resulting errors (InvalidEventError)
        validEvents.push(Event.fromRecord(record))
      } catch (error) {
        if (!(error instanceof DerivedEvent.InvalidDerivedEventError)) {
          rollbar.error('Event.fromRecord(record) error', error, {record: record})
        }
      }
    })

    if (validEvents.length > 0) {
      const sqs = new AWS.SQS({apiVersion: '2012-11-05', region: 'us-east-1'})
      const entries = validEvents.map((event => ({
        Id: event.event_id,
        MessageBody: JSON.stringify(event.toJSON())
      })))

      sqs.sendMessageBatch({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/056154071827/scale-of-belief-production-UDPEnrichedEventsQueue-1C100YLPZXPHF',
        Entries: entries
      }, (err, data) => {
        lambdaCallback(null, data)
      })
    } else {
      lambdaCallback(null, 'Nothing processed')
    }
  } else {
    lambdaCallback(null, 'Nothing processed')
  }
})
