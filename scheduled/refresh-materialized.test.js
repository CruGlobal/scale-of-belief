'use strict'

const lambda = require('./refresh-materialized')
const RecentlyScored = require('../models/recently-scored')

const mockQuery = jest.fn()

jest.mock('../config/sequelize', () => {
  return function () {
    return {
      query: mockQuery
    }
  }
})

describe('Refresh Materialized lambda', () => {
  it('Should be defined', () => {
    expect(lambda).toBeDefined()
  })

  const mockTruncate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(RecentlyScored, 'destroy').mockImplementation(mockTruncate)
  })

  it('Should successfully refresh the materialized view', done => {
    mockQuery.mockImplementation(() => Promise.resolve())

    lambda.handler(null).then(() => {
      done()
    }).catch((error) => {
      done.fail(error)
    })
  })

  it('Should fail to refresh the materialized view', done => {
    mockQuery.mockImplementation(() => {
      return Promise.reject(new Error('No materialized view exists with the name "unscored"'))
    })

    lambda.handler(null).then((message) => {
      done.fail()
    }).catch((error) => {
      expect(error).not.toBeNull()
      expect(error).toEqual(new Error('No materialized view exists with the name "unscored"'))
      done()
    })
  })

  it('Should truncate the recently_scored table', done => {
    mockQuery.mockImplementation(() => Promise.resolve())

    lambda.handler(null).then(() => {
      expect(mockTruncate).toHaveBeenCalled()
      done()
    }).catch((error) => {
      done.fail(error)
    })
  })
})
