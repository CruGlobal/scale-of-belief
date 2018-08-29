'use strict'

const rollbar = require('../config/rollbar')
const AdobeCampaign = require('../config/adobe-campaign')
const {forEach} = require('lodash')
const ACCESS_TOKEN = 'scale-of-belief-lambda-campaign-access-token'

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  let message = lambdaEvent.Records[0].Sns.Message
  message = JSON.parse(message)
  const placement = message.placement
  const grMasterPersonId = message.grMasterPersonId

  const asyncHandler = async () => {
    let accessToken = await retrieveAccessToken()

    if (accessToken instanceof Error) {
      throw new Error(accessToken)
    }
    let matchedUsers = await AdobeCampaign.retrieveCampaignUser(grMasterPersonId, accessToken)

    let promises = []
    forEach(matchedUsers, (user) => {
      promises.push(AdobeCampaign.updateCampaignUserPlacement(user['PKey'], placement.placement, accessToken))
    })

    return Promise.all(promises).then((results) => {
      return Promise.resolve(`Successfully sent placement data for ${results.length} matched users to Adobe Campaign`)
    }).catch((error) => {
      return Promise.reject(error)
    })
  }

  const retrieveAccessToken = () => {
    return new Promise((resolve, reject) => {
      const redis = require('redis')
      const redisClient = redis.createClient(process.env.REDIS_PORT_6379_TCP_ADDR_PORT, process.env.REDIS_PORT_6379_TCP_ADDR)

      redisClient.on('error', (error) => {
        rollbar.warn(`Error connecting to Redis: ${error}`)
        AdobeCampaign.retrieveAccessToken().then((accessToken) => {
          redisClient.quit()
          resolve(accessToken)
        }).catch((error) => {
          redisClient.quit()
          reject(error)
        })
      })

      redisClient.get(ACCESS_TOKEN, (error, response) => {
        if (error) {
          rollbar.warn(`Error retrieving ACCESS_TOKEN: ${error}`)
          redisClient.quit()
        } else if (response) {
          redisClient.quit()
          resolve(response)
        }

        AdobeCampaign.retrieveAccessToken().then((accessToken) => {
          redisClient.quit()
          resolve(accessToken)
        }).catch((error) => {
          redisClient.quit()
          reject(error)
        })
      })
    })
  }

  asyncHandler().then((message) => {
    lambdaCallback(null, message)
  }).catch((error) => {
    rollbar.error('Something went wrong while sending the placement to Campaign: ' + error)
    lambdaCallback('Failed to send placement to Campaign: ' + error)
  })
})
