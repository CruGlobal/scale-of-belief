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
    const resourceUrl = url.parse(message.uri)
    await AemClient.updateScore(resourceUrl, message.score)
    await AemClient.publish(resourceUrl)
  } catch (err) {
    rollbar.error('Error syncing score update to AEM' + err)
    throw err
  }
}
