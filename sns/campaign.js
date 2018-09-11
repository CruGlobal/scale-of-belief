'use strict'

const rollbar = require('../config/rollbar')
const AdobeCampaign = require('../config/adobe-campaign')
const {forEach} = require('lodash')
const ACCESS_TOKEN = 'scale-of-belief-lambda-campaign-access-token'

const retrieveAccessToken = () => {
  return new Promise((resolve, reject) => {
    const redis = require('redis')
    const redisClient = redis.createClient(process.env.REDIS_PORT_6379_TCP_ADDR_PORT, process.env.REDIS_PORT_6379_TCP_ADDR)

    redisClient.on('error', (error) => {
      rollbar.warn(`Error connecting to Redis: ${error}`)
      AdobeCampaign.retrieveAccessToken().then((accessToken) => {
        disconnectClient(redisClient)
        resolve(accessToken)
      }).catch((error) => {
        disconnectClient(redisClient)
        reject(error)
      })
    })

    redisClient.on('end', () => {
      console.log('Disconnected from Redis')
    })

    redisClient.get(ACCESS_TOKEN, (error, response) => {
      if (error) {
        rollbar.warn(`Error retrieving ACCESS_TOKEN: ${error}`)
        disconnectClient(redisClient)
      } else if (response) {
        disconnectClient(redisClient)
        resolve(response)
      }

      AdobeCampaign.retrieveAccessToken().then((accessToken) => {
        disconnectClient(redisClient)
        resolve(accessToken)
      }).catch((error) => {
        disconnectClient(redisClient)
        reject(error)
      })
    })
  })
}

const disconnectClient = (redisClient) => {
  if (redisClient.connected) {
    redisClient.quit()
  }
}

const asyncHandler = async (message) => {
  const placement = message.placement
  const grMasterPersonIds = message.grMasterPersonIds

  let accessToken = await retrieveAccessToken()

  let promises = []
  let matchedUsers = []
  for (let grMasterPersonId of grMasterPersonIds) {
    const campaignUsers = await AdobeCampaign.retrieveCampaignUser(grMasterPersonId, accessToken)
    matchedUsers = matchedUsers.concat(campaignUsers)
  }

  forEach(matchedUsers, (user) => {
    promises.push(AdobeCampaign.updateCampaignUserPlacement(user['PKey'], placement, accessToken))
  })

  return Promise.all(promises).then((results) => {
    return Promise.resolve(`Successfully sent placement data for ${results.length} matched users to Adobe Campaign`)
  }).catch((error) => {
    return Promise.reject(error)
  })
}

module.exports = {
  handler: rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
    let snsMessage = lambdaEvent.Records[0].Sns.Message

    asyncHandler(JSON.parse(snsMessage)).then((message) => {
      lambdaCallback(null, message)
    }).catch((error) => {
      rollbar.error('Something went wrong while sending the placement to Campaign: ' + error)
      lambdaCallback('Failed to send placement to Campaign: ' + error)
    })
  }),
  retrieveAccessToken: retrieveAccessToken,
  disconnectClient: disconnectClient
}
