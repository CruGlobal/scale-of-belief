'use strict'

const lambda = require('./refresh-materialized')

const mockQuery = jest.fn()

jest.mock('../config/sequelize', () => {
  return function () {
    return {
      query: mockQuery
    }
  }
})

const context = {
  getRemainingTimeInMillis: jest.fn()
}

describe('Refresh Materialized lambda', () => {
  it('Should be defined', () => {
    expect(lambda).toBeDefined()
  })

  it('Should successfully refresh the materialized view', done => {
    jest.clearAllMocks()
    mockQuery.mockImplementation(() => Promise.resolve())

    lambda.handler(null, context, (error, message) => {
      expect(error).toBeNull()
      expect(message).toBeDefined()
      expect(message).toEqual('Successfully refreshed the materialized view: unscored')
      done()
    })
  })

  it('Should fail to refresh the materialized view', done => {
    jest.clearAllMocks()
    mockQuery.mockClear()
    mockQuery.mockImplementation(() => Promise.reject(new Error('No materialized view exists with the name "unscored"'))
    )

    lambda.handler(null, context, (error, message) => {
      expect(error).not.toBeNull()
      expect(error).toEqual('Error refreshing the materialized view: unscored: Error: No materialized view exists with the name "unscored"')
      done()
    })
  })
})
