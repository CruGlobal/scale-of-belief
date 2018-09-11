'use strict'

const redshift = require('./redshift')
const redis = require('redis')
const {Client} = require('pg')
const fs = require('fs')
const path = require('path')

const EVENTS_TABLE = 'events'
const SCORES_TABLE = 'scores'

jest.mock('pg', () => ({
  Client: jest.fn()
}))

describe('Redshift lambda', () => {
  beforeAll(() => {
    Client.mockImplementation(() => {
      return {
        constructor: (params) => {
          this.user = params.user
          this.password = params.password
          this.database = params.database
          this.host = params.host
          this.port = params.port
        },

        connect: () => {
          return Promise.resolve()
        },

        query: (queryToRun) => {
          if (typeof queryToRun === 'object' && queryToRun.text) { // this is the COPY TO query
            if (queryToRun.text.indexOf(EVENTS_TABLE) !== -1) {
              return Promise.resolve(fs.createReadStream(path.join(__fixturesDir, 'db', EVENTS_TABLE, `${EVENTS_TABLE}.csv`)))
            }
            return Promise.resolve(fs.createReadStream(path.join(__fixturesDir, 'db', SCORES_TABLE, `${SCORES_TABLE}.csv`)))
          }
          // The Redshift queries will come here and don't care about return values
          return Promise.resolve()
        },

        end: () => {
          return Promise.resolve()
        }
      }
    })
  })

  it('Should be defined', () => {
    expect(redshift).toBeDefined()
  })

  it('Should successfully send data to Redshift', done => {
    redshift.handler(null, null, (error, message) => {
      expect(error).toBeNull()
      expect(message).toBeDefined()
      expect(message).toEqual('Redshift deltas successful.')
      done()
    })
  })

  it('Should fail if the query to Redis fails', done => {
    jest.spyOn(redis, 'createClient').mockImplementationOnce(() => {
      return {
        on: () => {},
        get: (key, callback) => {
          callback(new Error('Failed to retrieve'), null)
        },
        set: () => {},
        quit: () => {}
      }
    })
    redshift.handler(null, null, (error, message) => {
      expect(error).toBeDefined()
      expect(error).toEqual(new Error('Failed to retrieve'))
      done()
    })
  })

  it('Should fail if setting last success in Redis fails', done => {
    jest.spyOn(redis, 'createClient').mockImplementationOnce(() => {
      return {
        on: () => {},
        get: (key, callback) => {
          callback(null, null)
        },
        set: (key, value, callback) => {
          callback(new Error('Failed to set'), null)
        },
        quit: () => {}
      }
    })
    redshift.handler(null, null, (error, message) => {
      expect(error).toBeDefined()
      expect(error).toEqual(new Error('Failed to set'))
      done()
    })
  })

  it('Should fail if connecting to Redis fails', done => {
    jest.spyOn(redis, 'createClient').mockImplementationOnce(() => {
      return {
        on: (type, callback) => {
          if (type === 'error') {
            callback(new Error('Failed to connect'))
          }
        },
        get: () => {},
        set: () => {},
        quit: () => {}
      }
    })
    try {
      redshift.handler(null, null, () => {})
    } catch (error) {
      expect(error).toBeDefined()
      expect(error).toEqual(new Error('Failed to connect'))
      done()
    }
  })
})
