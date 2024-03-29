'use strict'

const redshift = require('./redshift')
const redis = require('redis')
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
const Readable = require('stream').Readable

const EVENTS_TABLE = 'events'
const SCORES_TABLE = 'scores'
const USER_AUDITS_TABLE = 'user_audits'

jest.mock('pg', () => ({
  Client: jest.fn()
}))

const context = {
  getRemainingTimeInMillis: jest.fn()
}

describe('Redshift lambda', () => {
  it('Should be defined', () => {
    expect(redshift).toBeDefined()
  })

  const pgClientConstructor = (params) => {
    this.user = params.user
    this.password = params.password
    this.database = params.database
    this.host = params.host
    this.port = params.port
  }

  const pgSuccessfulQuery = jest.fn().mockImplementation((queryToRun) => {
    if (typeof queryToRun === 'object' && queryToRun.text) { // this is the COPY TO query
      if (queryToRun.text.indexOf(EVENTS_TABLE) !== -1) {
        return Promise.resolve(fs.createReadStream(path.join(__fixturesDir, 'db', EVENTS_TABLE, `${EVENTS_TABLE}.csv`)))
      } else if (queryToRun.text.indexOf(SCORES_TABLE) !== -1) {
        return Promise.resolve(fs.createReadStream(path.join(__fixturesDir, 'db', SCORES_TABLE, `${SCORES_TABLE}.csv`)))
      } else {
        return Promise.resolve(fs.createReadStream(path.join(__fixturesDir, 'db', USER_AUDITS_TABLE, `${USER_AUDITS_TABLE}.csv`)))
      }
    }
    // The Redshift queries will come here and don't care about return values
    return Promise.resolve()
  })

  describe('Successful lambda calls', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      Client.mockImplementation(() => {
        return {
          constructor: pgClientConstructor,
          connect: () => Promise.resolve(),
          query: pgSuccessfulQuery,
          end: () => Promise.resolve()
        }
      })
    })

    it('Should successfully send data to Redshift', done => {
      redshift.handler(null, context, (error, message) => {
        expect(error).toBeNull()
        expect(message).toBeDefined()
        expect(message).toEqual('Redshift deltas successful.')
        expect(pgSuccessfulQuery).toHaveBeenCalledTimes(24)
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('CREATE TEMP TABLE staging_events (LIKE scale_of_belief.events)')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('CREATE TEMP TABLE staging_scores (LIKE scale_of_belief.scores)')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('CREATE TEMP TABLE staging_user_audits (LIKE scale_of_belief.user_audits)')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('DELETE FROM scale_of_belief.events\n      USING staging_events\n      WHERE scale_of_belief.events.id = staging_events.id')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('DELETE FROM scale_of_belief.scores\n      USING staging_scores\n      WHERE scale_of_belief.scores.uri = staging_scores.uri')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('DELETE FROM scale_of_belief.user_audits\n      USING staging_user_audits\n      WHERE scale_of_belief.user_audits.id = staging_user_audits.id AND scale_of_belief.user_audits.old_id = staging_user_audits.old_id')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('INSERT INTO scale_of_belief.events SELECT * FROM staging_events')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('INSERT INTO scale_of_belief.scores SELECT * FROM staging_scores')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('INSERT INTO scale_of_belief.user_audits SELECT * FROM staging_user_audits')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('DROP TABLE IF EXISTS staging_events')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('DROP TABLE IF EXISTS staging_scores')
        expect(pgSuccessfulQuery).toHaveBeenCalledWith('DROP TABLE IF EXISTS staging_user_audits')
        done()
      })
    })
  })

  describe('Redis failures', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      Client.mockImplementation(() => {
        return {
          constructor: pgClientConstructor,
          connect: () => Promise.resolve(),
          query: pgSuccessfulQuery,
          end: () => Promise.resolve()
        }
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
      redshift.handler(null, context, (error, message) => {
        expect(error).not.toBeNull()
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
      redshift.handler(null, context, (error, message) => {
        expect(error).not.toBeNull()
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
        redshift.handler(null, context, () => {})
      } catch (error) {
        expect(error).not.toBeNull()
        expect(error).toEqual(new Error('Failed to connect'))
        done()
      }
    })
  })

  describe('Redshift failure', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      Client.mockImplementation(() => {
        return {
          constructor: pgClientConstructor,
          connect: () => Promise.resolve(),

          query: (queryToRun) => {
            if (typeof queryToRun === 'object' && queryToRun.text) { // this is the COPY TO query
              if (queryToRun.text.indexOf(EVENTS_TABLE) !== -1) {
                return Promise.resolve(fs.createReadStream(path.join(__fixturesDir, 'db', EVENTS_TABLE, `${EVENTS_TABLE}.csv`)))
              }
              return Promise.resolve(fs.createReadStream(path.join(__fixturesDir, 'db', SCORES_TABLE, `${SCORES_TABLE}.csv`)))
            } else if (queryToRun === 'BEGIN' || queryToRun === 'ROLLBACK') {
              return Promise.resolve()
            }
            // Error on Redshift queries
            throw new Error('Some error occurred')
          },

          end: () => Promise.resolve()
        }
      })
    })
    it('Should fail if a Redshift query fails', done => {
      redshift.handler(null, context, (error, message) => {
        expect(error).not.toBeNull()
        expect(error).toEqual(new Error('Some error occurred'))
        done()
      })
    })
  })

  describe('Copy to S3', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('Should skip copying to redshift if there is no data', done => {
      const mockQuery = jest.fn()
      const mockPipe = jest.fn()

      Client.mockImplementation(() => {
        return {
          constructor: pgClientConstructor,
          connect: () => Promise.resolve(),
          query: mockQuery,
          end: () => Promise.resolve()
        }
      })

      mockPipe.mockImplementation(() => {
        return {
          bytesRead: -1 // this is to differentiate it from all of the 0 values above
        }
      })

      mockQuery.mockImplementation((queryToRun) => {
        if (typeof queryToRun === 'object' && queryToRun.text) {
          const s = new Readable()
          s._read = () => {}
          s.push(null)
          s.pipe = mockPipe
          return Promise.resolve(s)
        }
        return Promise.resolve()
      })

      redshift.handler(null, context, (error, message) => {
        expect(error).toBeNull()
        expect(mockQuery).not.toHaveBeenCalledWith('BEGIN')
        done()
      })
    })

    it('Should fail if copy to S3 fails', done => {
      Client.mockImplementation(() => {
        return {
          constructor: pgClientConstructor,
          connect: () => Promise.resolve(),
          query: () => {
            throw new Error('Some error occurred')
          },
          end: () => Promise.resolve()
        }
      })

      redshift.handler(null, context, (error, message) => {
        expect(error).not.toBeNull()
        expect(error).toEqual(new Error('Some error occurred'))
        done()
      })
    })
  })
})
