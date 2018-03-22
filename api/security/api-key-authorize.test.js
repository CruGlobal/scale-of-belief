'use strict'

const ApiKey = require('../../models/api-key')
const Authorizer = require('./api-key-authorize')

describe('Api Key Authorizer', () => {
  let response = {}

  test('is defined', () => {
    expect(Authorizer).toBeDefined()
  })

  describe('has valid API key', () => {
    let apiKey = {
      api_key: 'some-api-key',
      api_pattern: [
        '.*'
      ]
    }

    let requestHeaders = {}
    requestHeaders['x-api-key'] = apiKey.api_key

    test('should succeed on GET request', done => {
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        headers: requestHeaders
      }

      const next = (error) => {
        expect(error).toBeUndefined()
        done()
      }
      jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve(apiKey))

      Authorizer(request, response, next)
    })

    test('should succeed on POST request', done => {
      const request = {
        method: 'POST',
        body: {
          uri: 'http://some.uri.com'
        },
        headers: requestHeaders
      }

      const next = (error) => {
        expect(error).toBeUndefined()
        done()
      }
      jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve(apiKey))

      Authorizer(request, response, next)
    })
  })

  describe('has invalid API key', () => {
    let invalidRequestHeaders = {}
    invalidRequestHeaders['x-api-key'] = 'invalid-api-key'

    let unauthorizedError = new Error('Unauthorized')
    unauthorizedError.status = 401

    test('should should return Unauthorized on GET request', done => {
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        headers: invalidRequestHeaders
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve(null))

      Authorizer(request, response, next)
    })

    test('should should return Unauthorized on POST request', done => {
      const request = {
        method: 'POST',
        body: {
          uri: 'http://some.uri.com'
        },
        headers: invalidRequestHeaders
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve(null))

      Authorizer(request, response, next)
    })
  })

  describe('has API key without access to resource', () => {
    let apiKey = {
      api_key: 'some-api-key',
      api_pattern: [
        '.*nowhere.*'
      ]
    }

    let invalidRequestHeaders = {}
    invalidRequestHeaders['x-api-key'] = apiKey.api_key

    let unauthorizedError = new Error('You do not have access to this resource')
    unauthorizedError.status = 401

    test('should should return Unauthorized on GET request', done => {
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        headers: invalidRequestHeaders
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve(apiKey))

      Authorizer(request, response, next)
    })

    test('should should return Unauthorized on POST request', done => {
      const request = {
        method: 'POST',
        body: {
          uri: 'http://some.uri.com'
        },
        headers: invalidRequestHeaders
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve(apiKey))

      Authorizer(request, response, next)
    })
  })

  describe('has no API key', () => {
    let unauthorizedError = new Error('Unauthorized')
    unauthorizedError.status = 401

    test('should return Unauthorized', done => {
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        headers: {}
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }

      Authorizer(request, response, next)
    })
  })

  describe('fails database lookup', () => {
    let requestHeaders = {}
    requestHeaders['x-api-key'] = 'abc'

    let unauthorizedError = new Error('Unauthorized')
    unauthorizedError.status = 401

    test('should return Unauthorized', done => {
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        headers: requestHeaders
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.reject(new Error('api_key is not a valid uuid')))

      Authorizer(request, response, next)
    })
  })
})