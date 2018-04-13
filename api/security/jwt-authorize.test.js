'use strict'

const ApiUser = require('../../models/api-user')
const JwtAuthorizer = require('./jwt-authorize')

/*
 * Note: express-jwt handles the parsing of the JWT. If the parsing succeeds,
 * the request will have a user object with the values from the JWT inside.
 */
describe('JWT Authorizer', () => {
  let response = {}
  let guid = 'some-guid'

  test('is defined', () => {
    expect(JwtAuthorizer).toBeDefined()
  })

  describe('has valid JWT', () => {
    let apiUser = {
      guid: guid,
      api_pattern: [
        '.*'
      ]
    }

    test('should succeed on GET request', done => {
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        user: {
          guid: guid
        }
      }

      const next = (error) => {
        expect(error).toBeUndefined()
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(apiUser))

      JwtAuthorizer(request, response, next)
    })

    test('should succeed on POST request', done => {
      const request = {
        method: 'POST',
        body: {
          uri: 'http://some.uri.com'
        },
        user: {
          guid: guid
        }
      }

      const next = (error) => {
        expect(error).toBeUndefined()
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(apiUser))

      JwtAuthorizer(request, response, next)
    })

    test('should succeed with non-array api_pattern', done => {
      apiUser.api_pattern = '.*'
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        user: {
          guid: guid
        }
      }

      const next = (error) => {
        expect(error).toBeUndefined()
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(apiUser))

      JwtAuthorizer(request, response, next)
    })
  })

  // Note: express-jwt should catch the issue with its own handling before our application logic ever gets called
  describe('has invalid JWT', () => {
    let unauthorizedError = new Error('Unauthorized')
    unauthorizedError.status = 401

    test('should return Unauthorized on GET request', done => {
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        }
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(null))

      JwtAuthorizer(request, response, next)
    })

    test('should return Unauthorized on POST request', done => {
      const request = {
        method: 'POST',
        body: {
          uri: 'http://some.uri.com'
        }
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(null))

      JwtAuthorizer(request, response, next)
    })
  })

  describe('has JWT without access to resource', () => {
    let apiUser = {
      guid: guid,
      api_pattern: [
        '.*nowhere.*'
      ]
    }

    let unauthorizedError = new Error('You do not have access to this resource')
    unauthorizedError.status = 401

    test('should return Unauthorized on GET request', done => {
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        user: {
          guid: guid
        }
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(apiUser))

      JwtAuthorizer(request, response, next)
    })

    test('should return Unauthorized on POST request', done => {
      const request = {
        method: 'POST',
        body: {
          uri: 'http://some.uri.com'
        },
        user: {
          guid: guid
        }
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(apiUser))

      JwtAuthorizer(request, response, next)
    })

    test('should return Unauthorized when having a null api_pattern', done => {
      apiUser.api_pattern = null

      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        user: {
          guid: guid
        }
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(apiUser))

      JwtAuthorizer(request, response, next)
    })

    test('should return Unauthorized when having a non-array api_pattern', done => {
      apiUser.api_pattern = '.*nowhere.*'

      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        user: {
          guid: guid
        }
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(apiUser))

      JwtAuthorizer(request, response, next)
    })
  })

  describe('fails database lookup', () => {
    let unauthorizedError = new Error('Unauthorized')
    unauthorizedError.status = 401

    test('should return Unauthorized', done => {
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        user: {
          guid: 'fail'
        }
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.reject(new Error('guid is not a valid uuid')))

      JwtAuthorizer(request, response, next)
    })
  })

  describe('has JWT with non-existing user in local database', () => {
    let unauthorizedError = new Error('Unauthorized')
    unauthorizedError.status = 401

    test('should return Unauthorized on GET request', done => {
      const request = {
        method: 'GET',
        query: {
          uri: 'http://some.uri.com'
        },
        user: {
          guid: 'other-guid'
        }
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(null))

      JwtAuthorizer(request, response, next)
    })

    test('should return Unauthorized on POST request', done => {
      const request = {
        method: 'POST',
        body: {
          uri: 'http://some.uri.com'
        },
        user: {
          guid: 'other-guid'
        }
      }

      const next = (error) => {
        expect(error).toBeDefined()
        expect(error).toEqual(unauthorizedError)
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(null))

      JwtAuthorizer(request, response, next)
    })
  })

  describe('has super JWT token', () => {
    test('should succeed on GET request', done => {
      const apiUser = {
        guid: guid,
        api_pattern: [],
        type: 'super'
      }

      const request = {
        method: 'GET',
        user: {
          guid: guid
        }
      }

      const next = (error) => {
        expect(error).toBeUndefined()
        done()
      }
      jest.spyOn(ApiUser, 'findOne').mockImplementation(() => Promise.resolve(apiUser))

      JwtAuthorizer(request, response, next)
    })
  })
})
