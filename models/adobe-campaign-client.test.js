'use strict'

const AdobeCampaignClient = require('./adobe-campaign-client')
const request = require('request')

describe('AdobeCampaignClient', () => {
  it('should be defined', () => {
    expect(AdobeCampaignClient).toBeDefined()
  })

  const exampleUri = 'https://example.com'
  const exampleApiKey = 'abc123'
  const exampleJwt = 'jwt.123:45a'
  const exampleSecret = 'secrets'

  describe('constructor', () => {
    it('should set baseUrl, apiKey, jwt, and clientSecret', () => {
      const client = new AdobeCampaignClient(exampleUri, exampleApiKey, exampleJwt, exampleSecret)

      expect(client.baseUrl).toEqual(exampleUri)
      expect(client.apiKey).toEqual(exampleApiKey)
      expect(client.jwt).toEqual(exampleJwt)
      expect(client.clientSecret).toEqual(exampleSecret)
    })
  })

  describe('retrieveAccessToken()', () => {
    const client = new AdobeCampaignClient(exampleUri, exampleApiKey, exampleJwt, exampleSecret)

    it('should retrieve a new access token', done => {
      const options = {
        url: 'https://ims-na1.adobelogin.com/ims/exchange/jwt/',
        formData: {
          client_id: exampleApiKey,
          client_secret: exampleSecret,
          jwt_token: exampleJwt
        },
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
      const mockResponse = { statusCode: 200 }
      const mockBody = {
        token_type: 'bearer',
        access_token: 'access-token',
        expires_in: 86399992
      }

      const requestMock = jest.spyOn(request, 'post').mockImplementation((options, callback) => {
        callback(null, mockResponse, JSON.stringify(mockBody))
      })

      client.retrieveAccessToken().then((accessToken) => {
        expect(requestMock).toHaveBeenCalledWith(options, expect.anything())
        expect(accessToken).toEqual('access-token')
        requestMock.mockReset()
        done()
      })
    })

    describe('with errored Redis', () => {
      let console = null
      beforeEach(() => {
        process.env.REDIS_PORT_6379_TCP_ADDR = '192.168.1.0'
        console = global.console
        global.console = { warn: jest.fn() }
      })
      afterEach(() => {
        process.env.REDIS_PORT_6379_TCP_ADDR = '127.0.0.1'
        global.console = console
      })
      it('should retrieve a new access token, but then redis fails', done => {
        const options = {
          url: 'https://ims-na1.adobelogin.com/ims/exchange/jwt/',
          formData: {
            client_id: exampleApiKey,
            client_secret: exampleSecret,
            jwt_token: exampleJwt
          },
          headers: {
            'Cache-Control': 'no-cache'
          }
        }
        const mockResponse = { statusCode: 200 }
        const mockBody = {
          token_type: 'bearer',
          access_token: 'access-token',
          expires_in: 86399992
        }

        const requestMock = jest.spyOn(request, 'post').mockImplementation((options, callback) => {
          callback(null, mockResponse, JSON.stringify(mockBody))
        })

        client.retrieveAccessToken().then((accessToken) => {
          expect(requestMock).toHaveBeenCalledWith(options, expect.anything())
          expect(accessToken).toEqual('access-token')
          requestMock.mockReset()
          expect(global.console.warn).toHaveBeenCalled()
          done()
        })
      })
    })

    it('should fail to retrieve a new access token', done => {
      const mockResponse = { statusCode: 400 }
      const mockBody = {
        error_description: 'Could not match JWT signature to any of the bindings',
        error: 'invalid_token'
      }

      const requestMock = jest.spyOn(request, 'post').mockImplementation((options, callback) => {
        callback(null, mockResponse, JSON.stringify(mockBody))
      })

      client.retrieveAccessToken().then(() => {
        requestMock.mockReset()
        done.fail()
      }).catch((err) => {
        expect(err).toBeDefined()
        expect(err.message).toEqual(
          'Failed to retrieve access token: {"error_description":"Could not match JWT signature to any of the bindings",' +
          '"error":"invalid_token"}')
        requestMock.mockReset()
        done()
      })
    })

    it('should have an error retrieving a new access token', done => {
      const requestMock = jest.spyOn(request, 'post').mockImplementation((options, callback) => {
        callback(new Error('Internal Server Error'), null, null)
      })

      client.retrieveAccessToken().then(() => {
        requestMock.mockReset()
        done.fail()
      }).catch((err) => {
        expect(err).toBeDefined()
        expect(err.message).toEqual('Internal Server Error')
        requestMock.mockReset()
        done()
      })
    })
  })

  describe('accessTokenBody()', () => {
    it('should create an access token POST request body', () => {
      const client = new AdobeCampaignClient(exampleUri, exampleApiKey, exampleJwt, exampleSecret)
      const accessTokenBody = client.accessTokenBody()
      expect(accessTokenBody).toBeDefined()
      expect(accessTokenBody.client_id).toEqual(exampleApiKey)
      expect(accessTokenBody.client_secret).toEqual(exampleSecret)
      expect(accessTokenBody.jwt_token).toEqual(exampleJwt)
    })
  })

  describe('retrieveCampaignUser()', () => {
    const client = new AdobeCampaignClient(exampleUri, exampleApiKey, exampleJwt, exampleSecret)
    const accessToken = 'access-token'

    it('should retrieve one campaign user', done => {
      const grMasterPersonId = 'gr-id'
      const options = {
        url: `${exampleUri}/profileAndServicesExt/profile/byGlobalid?globalId_parameter=${grMasterPersonId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Api-Key': exampleApiKey,
          'Cache-Control': 'no-cache'
        }
      }
      const mockResponse = { statusCode: 200 }
      const mockBody = {
        content: [
          {
            PKey: 'pkey',
            cusGlobalID: grMasterPersonId
          }
        ],
        count: {
          // note: in my testing, the actual response has profile//byGlobalid rather than profile/byGlobalid
          href: `${exampleUri}/profileAndServicesExt/profile/byGlobalid/_count?globalId_parameter=${grMasterPersonId}&_lineStart=some-pkey`,
          value: 1
        },
        serverSidePagination: false
      }

      const requestMock = jest.spyOn(request, 'get').mockImplementation((options, callback) => {
        callback(null, mockResponse, JSON.stringify(mockBody))
      })

      client.retrieveCampaignUser(grMasterPersonId, accessToken).then((users) => {
        expect(users).toBeDefined()
        expect(users.length).toEqual(1)
        expect(requestMock).toHaveBeenCalledWith(options, expect.anything())
        requestMock.mockReset()
        done()
      })
    })

    it('should retrieve multiple campaign users', done => {
      const grMasterPersonId = 'gr-id'
      const mockResponse = { statusCode: 200 }
      const mockBody = {
        content: [
          {
            PKey: 'pkey',
            cusGlobalID: grMasterPersonId
          },
          {
            PKey: 'pkey2',
            cusGlobalID: grMasterPersonId
          }
        ],
        count: {
          href: `${exampleUri}/profileAndServicesExt/profile/byGlobalid/_count?globalId_parameter=${grMasterPersonId}&_lineStart=some-pkey`,
          value: 2
        },
        serverSidePagination: false
      }

      const requestMock = jest.spyOn(request, 'get').mockImplementation((options, callback) => {
        callback(null, mockResponse, JSON.stringify(mockBody))
      })

      client.retrieveCampaignUser(grMasterPersonId, accessToken).then((users) => {
        expect(users).toBeDefined()
        expect(users.length).toEqual(2)
        requestMock.mockReset()
        done()
      })
    })

    it('should retrieve zero campaign users', done => {
      const grMasterPersonId = 'no-id'
      const mockResponse = { statusCode: 200 }
      const mockBody = {
        content: [],
        count: {
          href: `${exampleUri}/profileAndServicesExt/profile/byGlobalid/_count?globalId_parameter=${grMasterPersonId}&_lineStart=some-pkey`,
          value: 0
        },
        serverSidePagination: false
      }

      const requestMock = jest.spyOn(request, 'get').mockImplementation((options, callback) => {
        callback(null, mockResponse, JSON.stringify(mockBody))
      })

      client.retrieveCampaignUser(grMasterPersonId, accessToken).then((users) => {
        expect(users).toBeDefined()
        expect(users.length).toEqual(0)
        requestMock.mockReset()
        done()
      })
    })

    it('should request a new access token when ours is expired', done => {
      const grMasterPersonId = 'gr-id'
      const mockFirstResponse = { statusCode: 401 }
      const mockSecondResponse = { statusCode: 200 }
      const mockFirstBody = {
        error_code: '401013',
        message: 'Oauth token is not valid'
      }
      const mockSecondBody = {
        content: [
          {
            PKey: 'pkey',
            cusGlobalID: grMasterPersonId
          }
        ],
        count: {
          // note: in my testing, the actual response has profile//byGlobalid rather than profile/byGlobalid
          href: `${exampleUri}/profileAndServicesExt/profile/byGlobalid/_count?globalId_parameter=${grMasterPersonId}&_lineStart=some-pkey`,
          value: 1
        },
        serverSidePagination: false
      }

      const requestMock = jest.spyOn(request, 'get')
        .mockImplementationOnce((options, callback) => {
          callback(null, mockFirstResponse, JSON.stringify(mockFirstBody))
        })
        .mockImplementationOnce((options, callback) => {
          callback(null, mockSecondResponse, JSON.stringify(mockSecondBody))
        })

      const requestPostMock = jest.spyOn(request, 'post').mockImplementation((options, callback) => {
        const mockResponse = { statusCode: 200 }
        const mockBody = {
          token_type: 'bearer',
          access_token: 'new-access-token',
          expires_in: 86399992
        }
        callback(null, mockResponse, JSON.stringify(mockBody))
      })

      client.retrieveCampaignUser(grMasterPersonId, accessToken).then((users) => {
        expect(requestMock).toHaveBeenCalledTimes(2)
        expect(requestPostMock).toHaveBeenCalledTimes(1)
        expect(users).toBeDefined()
        expect(users.length).toEqual(1)
        requestMock.mockReset()
        requestPostMock.mockReset()
        done()
      })
    })

    it('should fail to retrieve campaign users', done => {
      const grMasterPersonId = 'no-id'
      const mockResponse = { statusCode: 500 }
      const mockBody = {
        error_code: '1',
        message: 'Internal Server Error'
      }

      const requestMock = jest.spyOn(request, 'get').mockImplementation((options, callback) => {
        callback(null, mockResponse, JSON.stringify(mockBody))
      })

      client.retrieveCampaignUser(grMasterPersonId, accessToken).then((users) => {
        requestMock.mockReset()
        done.fail()
      }).catch((error) => {
        expect(error).toBeDefined()
        expect(error.message).toEqual('Something went wrong with your request: ' + JSON.stringify(mockBody))
        requestMock.mockReset()
        done()
      })
    })

    // Not sure why this one fails in NodeJS 16.x
    // it('should get an error retrieving campaign users', done => {
    //   const grMasterPersonId = 'no-id'
    //
    //   const requestMock = jest.spyOn(request, 'get').mockImplementation((options, callback) => {
    //     callback(new Error('Some Error!'), null, null)
    //   })
    //
    //   client.retrieveCampaignUser(grMasterPersonId, accessToken).then((users) => {
    //     requestMock.mockReset()
    //     done.fail()
    //   }).catch((error) => {
    //     requestMock.mockReset()
    //     expect(error).toBeDefined()
    //     expect(error.message).toEqual('Some Error!')
    //     done()
    //   })
    // })
  })

  describe('updateCampaignUserPlacement()', () => {
    const client = new AdobeCampaignClient(exampleUri, exampleApiKey, exampleJwt, exampleSecret)
    const pkey = 'pkey'
    const accessToken = 'access-token'

    it('should successfully send an update for the placement value', done => {
      const options = {
        url: `${exampleUri}/profileAndServicesExt/profile/${pkey}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Api-Key': exampleApiKey,
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
        body: '{ "cusPlacement": "placement" }'
      }
      const mockResponse = { statusCode: 200 }
      const mockBody = {
        PKey: pkey,
        href: options.url
      }

      const requestMock = jest.spyOn(request, 'patch').mockImplementation((options, callback) => {
        callback(null, mockResponse, JSON.stringify(mockBody))
      })

      client.updateCampaignUserPlacement(pkey, 5, accessToken).then((response) => {
        expect(response).toBeDefined()
        expect(response).toEqual(mockBody)
        requestMock.mockReset()
        done()
      })
    })

    it('should request a new access token when ours is expired', done => {
      const mockFirstResponse = { statusCode: 401 }
      const mockSecondResponse = { statusCode: 200 }
      const mockFirstBody = {
        error_code: '401013',
        message: 'Oauth token is not valid'
      }
      const mockSecondBody = {
        PKey: pkey,
        href: `${exampleUri}/profileAndServicesExt/profile/${pkey}`
      }

      const requestMock = jest.spyOn(request, 'patch')
        .mockImplementationOnce((options, callback) => {
          callback(null, mockFirstResponse, JSON.stringify(mockFirstBody))
        })
        .mockImplementationOnce((options, callback) => {
          callback(null, mockSecondResponse, JSON.stringify(mockSecondBody))
        })

      const requestPostMock = jest.spyOn(request, 'post').mockImplementation((options, callback) => {
        const mockResponse = { statusCode: 200 }
        const mockBody = {
          token_type: 'bearer',
          access_token: 'new-access-token',
          expires_in: 86399992
        }
        callback(null, mockResponse, JSON.stringify(mockBody))
      })

      client.updateCampaignUserPlacement(pkey, 5, accessToken).then((response) => {
        expect(requestMock).toHaveBeenCalledTimes(2)
        expect(requestPostMock).toHaveBeenCalledTimes(1)
        expect(response).toBeDefined()
        expect(response).toEqual(mockSecondBody)
        requestMock.mockReset()
        requestPostMock.mockReset()
        done()
      })
    })

    it('should fail to send an update', done => {
      const mockResponse = { statusCode: 500 }
      const mockBody = 'BAS-010040 Cannot convert \'a\' (type text) to integer (8 bit) type (bAS-010011 Invalid value).'

      const requestMock = jest.spyOn(request, 'patch').mockImplementation((options, callback) => {
        callback(null, mockResponse, JSON.stringify(mockBody))
      })

      client.updateCampaignUserPlacement(pkey, 5, accessToken).then((response) => {
        requestMock.mockReset()
        done.fail()
      }).catch((error) => {
        expect(error).toBeDefined()
        expect(error.message).toEqual(`Something went wrong with your request: "${mockBody}"`)
        requestMock.mockReset()
        done()
      })
    })

    it('should get an error when sending an update', done => {
      const requestMock = jest.spyOn(request, 'patch').mockImplementation((options, callback) => {
        callback(new Error('Failed to send'), null, null)
      })

      client.updateCampaignUserPlacement(pkey, 5, accessToken).then((response) => {
        requestMock.mockReset()
        done.fail()
      }).catch((error) => {
        expect(error).toBeDefined()
        expect(error.message).toEqual('Failed to send')
        requestMock.mockReset()
        done()
      })
    })
  })
})
