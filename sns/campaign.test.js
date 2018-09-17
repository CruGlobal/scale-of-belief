'use strict'

const campaign = require('./campaign')
const AdobeCampaign = require('../config/adobe-campaign')
const redis = require('redis')

const context = {
  getRemainingTimeInMillis: jest.fn()
}

describe('Campaign lambda', () => {
  it('Should be defined', () => {
    expect(campaign).toBeDefined()
  })

  jest.spyOn(AdobeCampaign, 'retrieveAccessToken').mockImplementation(() => {
    return Promise.resolve('new-access-token')
  })

  describe('retrieveAccessToken()', () => {
    let redisClient

    beforeEach(() => {
      redisClient = {
        on: () => {},
        get: () => {},
        quit: () => {},
        connected: false
      }
    })

    it('Should retrieve the access token from Redis', done => {
      campaign.retrieveAccessToken().then((accessToken) => {
        expect(accessToken).toBeDefined()
        expect(accessToken).toEqual('access-token')
        done()
      }).catch((error) => {
        done.fail(error)
      })
    })

    it('Should retrieve the access token from Adobe Campaign if Redis is empty', done => {
      redisClient.get = (key, callback) => {
        callback(null, null)
      }
      jest.spyOn(redis, 'createClient').mockImplementationOnce(() => {
        return redisClient
      })

      campaign.retrieveAccessToken().then((accessToken) => {
        expect(accessToken).toBeDefined()
        expect(accessToken).toEqual('new-access-token')
        done()
      }).catch((error) => {
        done.fail(error)
      })
    })

    it('Should retrieve the access token from Adobe Campaign if Redis gets an error when connecting', done => {
      redisClient.on = (type, callback) => {
        if (type === 'error') {
          callback(new Error('Some error occurred'))
        }
      }
      jest.spyOn(redis, 'createClient').mockImplementationOnce(() => {
        return redisClient
      })

      campaign.retrieveAccessToken().then((accessToken) => {
        expect(accessToken).toBeDefined()
        expect(accessToken).toEqual('new-access-token')
        done()
      }).catch((error) => {
        done.fail(error)
      })
    })

    it('Should retrieve the access token from Adobe Campaign if Redis gets an error when retrieving', done => {
      redisClient.get = (key, callback) => {
        callback(new Error('Fail!'), null)
      }
      jest.spyOn(redis, 'createClient').mockImplementationOnce(() => {
        return redisClient
      })

      campaign.retrieveAccessToken().then((accessToken) => {
        expect(accessToken).toBeDefined()
        expect(accessToken).toEqual('new-access-token')
        done()
      }).catch((error) => {
        done.fail(error)
      })
    })

    it('Should fail to retrieve the access token if Redis errors on connect and Adobe Campaign errors', done => {
      redisClient.on = (type, callback) => {
        if (type === 'error') {
          callback(new Error('Some error occurred'))
        }
      }
      jest.spyOn(redis, 'createClient').mockImplementationOnce(() => {
        return redisClient
      })

      jest.spyOn(AdobeCampaign, 'retrieveAccessToken').mockImplementationOnce(() => {
        return Promise.reject(new Error('Failed to retrieve access token: Some Error'))
      })

      campaign.retrieveAccessToken().then((accessToken) => {
        done.fail('We should have had an error')
      }).catch((error) => {
        expect(error).toBeDefined()
        done()
      })
    })

    it('Should fail to retrieve the access token if Redis errors on retrieve and Adobe Campaign errors', done => {
      redisClient.get = (key, callback) => {
        callback(new Error('Fail!'), null)
      }
      jest.spyOn(redis, 'createClient').mockImplementationOnce(() => {
        return redisClient
      })

      jest.spyOn(AdobeCampaign, 'retrieveAccessToken').mockImplementationOnce(() => {
        return Promise.reject(new Error('Failed to retrieve access token: Some Error'))
      })

      campaign.retrieveAccessToken().then((accessToken) => {
        done.fail('We should have had an error')
      }).catch((error) => {
        expect(error).toBeDefined()
        done()
      })
    })
  })

  describe('disconnectClient()', () => {
    it('Should disconnect the Redis client if it is connected', () => {
      const redisClient = {
        connected: true,
        quit: jest.fn()
      }

      campaign.disconnectClient(redisClient)
      expect(redisClient.quit).toHaveBeenCalled()
    })

    it('Should not disconnect the Redis client if it is not connected', () => {
      const redisClient = {
        connected: false,
        quit: jest.fn()
      }

      campaign.disconnectClient(redisClient)
      expect(redisClient.quit).not.toHaveBeenCalled()
    })
  })

  describe('handler()', () => {
    const payload = {
      placement: 8,
      grMasterPersonIds: ['some-gr-id']
    }
    const snsMessage = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify(payload)
          }
        }
      ]
    }

    it('Should successfully update one user placement', done => {
      jest.spyOn(AdobeCampaign, 'retrieveCampaignUser').mockImplementationOnce(() => {
        return Promise.resolve([{
          PKey: 'pkey',
          cusGlobalID: 'some-gr-id',
          cusPlacement: 7
        }])
      })

      jest.spyOn(AdobeCampaign, 'updateCampaignUserPlacement').mockImplementationOnce(() => {
        return Promise.resolve({
          PKey: 'pkey',
          cusGlobalID: 'some-gr-id',
          cusPlacement: payload.placement
        })
      })

      campaign.handler(snsMessage, context, (error, message) => {
        if (error) {
          done.fail(new Error(error))
        } else {
          expect(message).toEqual('Successfully sent placement data for 1 matched users to Adobe Campaign')
          done()
        }
      })
    })

    it('Should fail to update one user placement', done => {
      jest.spyOn(AdobeCampaign, 'retrieveCampaignUser').mockImplementationOnce(() => {
        return Promise.resolve([{
          PKey: 'pkey',
          cusGlobalID: 'some-gr-id',
          cusPlacement: 7
        }])
      })

      jest.spyOn(AdobeCampaign, 'updateCampaignUserPlacement').mockImplementationOnce(() => {
        return Promise.reject(new Error('Error!'))
      })

      campaign.handler(snsMessage, context, (error, message) => {
        if (error) {
          expect(error).toEqual('Failed to send placement to Campaign: Error: Error!')
          done()
        } else {
          done.fail(new Error('Should have had an error'))
        }
      })
    })

    it('Should successfully update multiple user placements', done => {
      const multiPayload = {
        placement: 8,
        grMasterPersonIds: ['some-gr-id', 'another-gr-id']
      }

      const multiSnsMessage = {
        Records: [
          {
            Sns: {
              Message: JSON.stringify(multiPayload)
            }
          }
        ]
      }

      jest.spyOn(AdobeCampaign, 'retrieveCampaignUser').mockImplementationOnce(() => {
        return Promise.resolve([{
          PKey: 'pkey',
          cusGlobalID: 'some-gr-id',
          cusPlacement: 7
        }])
      }).mockImplementationOnce(() => {
        return Promise.resolve([{
          PKey: 'pkey2',
          cusGlobalID: 'another-gr-id',
          cusPlacement: 5
        }])
      })

      jest.spyOn(AdobeCampaign, 'updateCampaignUserPlacement').mockImplementationOnce(() => {
        return Promise.resolve({
          PKey: 'pkey',
          cusGlobalID: 'some-gr-id',
          cusPlacement: payload.placement
        })
      }).mockImplementationOnce(() => {
        return Promise.resolve({
          PKey: 'pkey2',
          cusGlobalID: 'another-gr-id',
          cusPlacement: payload.placement
        })
      })

      campaign.handler(multiSnsMessage, context, (error, message) => {
        if (error) {
          done.fail(new Error(error))
        } else {
          expect(message).toEqual('Successfully sent placement data for 2 matched users to Adobe Campaign')
          done()
        }
      })
    })

    it('Should fail if the access token retrieval fails', done => {
      jest.spyOn(redis, 'createClient').mockImplementationOnce(() => {
        return {
          on: (type, callback) => {
            if (type === 'error') {
              callback(new Error('Some error occurred'))
            }
          },
          get: () => {},
          quit: () => {},
          connected: false
        }
      })

      jest.spyOn(AdobeCampaign, 'retrieveAccessToken').mockImplementationOnce(() => {
        return Promise.reject(new Error('Failed to retrieve access token: Some Error'))
      })

      campaign.handler(snsMessage, context, (error, message) => {
        if (error) {
          expect(error).toEqual('Failed to send placement to Campaign: Error: Failed to retrieve access token: Some Error')
          done()
        } else {
          done.fail(new Error('Should have had an error'))
        }
      })
    })

    it('Should successfully send 0 updates when user not found', done => {
      jest.spyOn(AdobeCampaign, 'retrieveCampaignUser').mockImplementationOnce(() => {
        return Promise.resolve([])
      })

      campaign.handler(snsMessage, context, (error, message) => {
        expect(error).toBeNull()
        expect(message).toEqual('Successfully sent placement data for 0 matched users to Adobe Campaign')
        done()
      })
    })
  })
})
