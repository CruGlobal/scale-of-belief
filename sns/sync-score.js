'use strict'

const rollbar = require('../config/rollbar')
const AemClient = require('../config/aem')
const url = require('url')

module.exports.handler = async (lambdaEvent) => {
  try {
    // Decode SNS message
    const snsMessage = lambdaEvent.Records[0].Sns.Message
    const message = JSON.parse(snsMessage)

    // Update score in AEM
    await AemClient.updateScore(url.parse(message.uri), message.score)
  } catch (err) {
    rollbar.error('Error syncing score update to AEM: ' + err)
    throw err
  }
}
