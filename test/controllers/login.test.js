'use strict'

const LoginController = require('../../api/controllers/login.js')
const jwt = require('jsonwebtoken')

describe('LoginController', () => {
  it('should be defined', () => {
    expect(LoginController).toBeDefined()
  })

  describe('has a valid access token', () => {
    it('should return a JWT', done => {
      const accessToken = 'valid-token'
      const validToken = 'valid-jwt'

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual(validToken)
          done()
        }
      }

      const mockedResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ssoguid: validToken })
      }
      global.fetch = jest.fn(() => Promise.resolve(mockedResponse))

      jest.spyOn(jwt, 'sign').mockImplementation((guid, secret, expires, callback) => { callback(null, validToken) })

      const request = {
        body: {
          access_token: accessToken
        }
      }

      LoginController.post(request, response)
    })
  })

  describe('has an invalid access token', () => {
    it('should return Unauthorized', done => {
      const accessToken = 'invalid-token'

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual({ message: 'Unauthorized' })
          done()
        },
        status: (statusToSet) => {
          expect(statusToSet).toBeDefined()
          expect(statusToSet).toEqual(401)
        }
      }

      const mockedResponse = {
        ok: false,
        status: 401,
        json: () => Promise.resolve({})
      }
      global.fetch = jest.fn(() => Promise.resolve(mockedResponse))

      const request = {
        body: {
          access_token: accessToken
        }
      }

      LoginController.post(request, response)
    })
  })

  describe('has no access token', () => {
    it('should return Unauthorized', done => {
      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual({ message: 'Unauthorized' })
          done()
        },
        status: (statusToSet) => {
          expect(statusToSet).toBeDefined()
          expect(statusToSet).toEqual(401)
        }
      }

      const request = {
        body: {}
      }

      LoginController.post(request, response)
    })
  })

  describe('receives a failure from Okta', () => {
    it('should return Internal Error', done => {
      const accessToken = 'token'

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual({ message: 'Internal Server Error' })
          done()
        },
        status: (statusToSet) => {
          expect(statusToSet).toBeDefined()
          expect(statusToSet).toEqual(500)
        }
      }

      const mockedResponse = {
        ok: false,
        status: 500,
        json: () => Promise.resolve({})
      }
      global.fetch = jest.fn(() => Promise.resolve(mockedResponse))

      const request = {
        body: {
          access_token: accessToken
        }
      }

      LoginController.post(request, response)
    })
  })

  describe('receives a failure when signing the JWT', () => {
    it('should return an Internal Server Error', done => {
      const accessToken = 'token'
      const guid = 'valid-guid'

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual({ message: 'Internal Server Error' })
          done()
        },
        status: (statusToSet) => {
          expect(statusToSet).toBeDefined()
          expect(statusToSet).toEqual(500)
        }
      }

      const mockedResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ssoguid: guid })
      }
      global.fetch = jest.fn(() => Promise.resolve(mockedResponse))

      jest.spyOn(jwt, 'sign').mockImplementation((guid, secret, expires, callback) => { callback(new Error('Test'), null) })

      const request = {
        body: {
          access_token: accessToken
        }
      }

      LoginController.post(request, response)
    })
  })
})
