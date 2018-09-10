'use strict'

const rollbar = require('../config/rollbar')
const GlobalRegistry = require('../config/global-registry')

module.exports.handler = async (lambdaEvent) => {
  try {
    // Decode SNS message
    const snsMessage = lambdaEvent.Records[0].Sns.Message
    const message = JSON.parse(snsMessage)
    // Update Global Registry
    await GlobalRegistry.updatePlacement(message.grMasterPersonIds, message.placement)
  } catch (err) {
    rollbar.error('Global Registry update error: ' + err)
    throw err
  }
}
