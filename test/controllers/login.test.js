'use strict'

const LoginController = require('../../api/controllers/login.js')
const https = require('https')
const jwt = require('jsonwebtoken')

describe('LoginController', () => {
  it('should be defined', () => {
    expect(LoginController).toBeDefined()
  })

  describe('has a valid service ticket', () => {
    it('should return a JWT', done => {
      const serviceTicket = 'valid-ticket'
      const guid = 'valid-guid'
      const validToken = 'valid-jwt'
      const personData = '{' +
        '"serviceResponse": {' +
          '"authenticationSuccess": {' +
            '"attributes": {' +
              '"ssoGuid": ["' + guid + '"] ' +
            '}' +
          '}' +
        '}' +
      '}'
      const httpsResponse = {
        data: personData,
        setEncoding: (encoding) => {
          // do nothing
        },
        on: (key, callback) => {
          callback(personData)
        }
      }

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual(validToken)
          done()
        }
      }

      const req = {
        on: (key, callback) => {
          // do nothing
        },
        end: () => {
          // done()
        }
      }

      jest.spyOn(https, 'request').mockImplementation((options, callback) => {
        callback(httpsResponse)
        return req
      })

      jest.spyOn(jwt, 'sign').mockImplementation((guid, secret, expires, callback) => { callback(null, validToken) })

      const request = {
        body: {
          ticket: serviceTicket
        }
      }

      LoginController.post(request, response)
    })
  })

  describe('has an invalid service ticket', () => {
    it('should return Unauthorized', done => {
      const serviceTicket = 'invalid-ticket'
      const failureData = '{' +
        '"serviceResponse": {' +
          '"authenticationFailure": {' +
            '"description": "Failed",' +
            '"code": "FAIL"' +
          '}' +
        '}' +
      '}'
      const httpsResponse = {
        data: failureData,
        setEncoding: (encoding) => {
          // do nothing
        },
        on: (key, callback) => {
          callback(failureData)
        }
      }

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

      const req = {
        on: (key, callback) => {
          // do nothing
        },
        end: () => {
          // done()
        }
      }

      jest.spyOn(https, 'request').mockImplementation((options, callback) => {
        callback(httpsResponse)
        return req
      })

      const request = {
        body: {
          ticket: serviceTicket
        }
      }

      LoginController.post(request, response)
    })
  })

  describe('has no service ticket', () => {
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

  describe('receives a failure from CAS', () => {
    it('should return Internal Error', done => {
      const serviceTicket = 'ticket'

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

      const req = {
        on: (key, callback) => {
          expect(key).toEqual('error')
          callback(new Error())
        },
        end: () => {
          // done()
        }
      }

      jest.spyOn(https, 'request').mockImplementation((options, callback) => {
        return req
      })

      const request = {
        body: {
          ticket: serviceTicket
        }
      }

      LoginController.post(request, response)
    })
  })

  describe('receives a failure when signing the JWT', () => {
    it('should return an Internal Server Error', done => {
      const serviceTicket = 'ticket'
      const guid = 'valid-guid'
      const personData = '{' +
        '"serviceResponse": {' +
          '"authenticationSuccess": {' +
            '"attributes": {' +
              '"ssoGuid": ["' + guid + '"] ' +
            '}' +
          '}' +
        '}' +
      '}'
      const httpsResponse = {
        data: personData,
        setEncoding: (encoding) => {
          // do nothing
        },
        on: (key, callback) => {
          callback(personData)
        }
      }

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

      const req = {
        on: (key, callback) => {
          // do nothing
        },
        end: () => {
          // done()
        }
      }

      jest.spyOn(https, 'request').mockImplementation((options, callback) => {
        callback(httpsResponse)
        return req
      })

      jest.spyOn(jwt, 'sign').mockImplementation((guid, secret, expires, callback) => { callback(new Error('Test'), null) })

      const request = {
        body: {
          ticket: serviceTicket
        }
      }

      LoginController.post(request, response)
    })
  })
})
