'use strict'

const request = require('request')
const redis = require('redis')

const ACCESS_TOKEN = 'scale-of-belief-lambda-campaign-access-token'

class AdobeCampaignClient {
  constructor (baseUrl, apiKey, jwt, clientSecret) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.jwt = jwt
    this.clientSecret = clientSecret
  }

  retrieveAccessToken () {
    let options = {
      url: 'https://ims-na1.adobelogin.com/ims/exchange/jwt/',
      formData: this.accessTokenBody(),
      headers: {
        'Cache-Control': 'no-cache'
      }
    }
    return new Promise((resolve, reject) => {
      request.post(options, (err, response, body) => {
        if (err) {
          reject(err)
        }

        if (response.statusCode === 200) {
          const redisClient = redis.createClient(process.env.REDIS_PORT_6379_TCP_ADDR_PORT, process.env.REDIS_PORT_6379_TCP_ADDR)
          redisClient.on('error', (error) => {
            redisClient.quit()
            // We want the system to be able to keep sending updates to ACS even if Redis is having issues
            console.warn('Failed to connect to Redis for updating the access token', error)
          })

          const accessToken = JSON.parse(body).access_token

          redisClient.set(ACCESS_TOKEN, accessToken, (error, response) => {
            if (error) {
              console.warn('Failed to set the new access token:', error)
            }
            redisClient.quit()
            resolve(accessToken)
          })
        } else {
          reject(new Error('Failed to retrieve access token: ' + body))
        }
      })
    })
  }

  accessTokenBody () {
    return {
      client_id: this.apiKey,
      client_secret: this.clientSecret,
      jwt_token: this.jwt
    }
  }

  /**
   * Returns all users with the given GR master person ID (cusGlobalID).
   */
  retrieveCampaignUser (grMasterPersonId, accessToken) {
    let options = {
      url: `${this.baseUrl}/profileAndServicesExt/profile/byGlobalid?globalId_parameter=${grMasterPersonId}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Api-Key': this.apiKey,
        'Cache-Control': 'no-cache'
      }
    }

    return new Promise((resolve, reject) => {
      request.get(options, async (err, response, body) => {
        if (err) {
          reject(err)
        } else if (response.statusCode === 401) {
          let newAccessToken = await this.retrieveAccessToken()
          resolve(this.retrieveCampaignUser(grMasterPersonId, newAccessToken))
        } else if (response.statusCode >= 400) {
          reject(new Error('Something went wrong with your request: ' + body))
        }

        resolve(JSON.parse(body).content)
      })
    })
  }

  updateCampaignUserPlacement (pkey, placement, accessToken) {
    let options = {
      url: `${this.baseUrl}/profileAndServicesExt/profile/${pkey}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Api-Key': this.apiKey,
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.placementBody(placement))
    }

    return new Promise((resolve, reject) => {
      request.patch(options, async (err, response, body) => {
        if (err) {
          reject(err)
        } else if (response.statusCode === 401) {
          let newAccessToken = await this.retrieveAccessToken()
          resolve(this.updateCampaignUserPlacement(pkey, placement, newAccessToken))
        } else if (response.statusCode >= 400) {
          reject(new Error('Something went wrong with your request: ' + body))
        }

        resolve(JSON.parse(body))
      })
    })
  }

  placementBody (placement) {
    return {
      cusPlacement: placement
    }
  }
}

module.exports = AdobeCampaignClient
