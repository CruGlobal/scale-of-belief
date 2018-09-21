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

describe('Refresh Materialized lambda', () => {
  it('Should be defined', () => {
    expect(lambda).toBeDefined()
  })

  it('Should successfully refresh the materialized view', done => {
    jest.clearAllMocks()
    mockQuery.mockImplementation(() => Promise.resolve())

    lambda.handler(null).then(() => {
      done()
    }).catch((error) => {
      done.fail(error)
    })
  })

  it('Should fail to refresh the materialized view', done => {
    jest.clearAllMocks()
    mockQuery.mockClear()
    mockQuery.mockImplementation(() => Promise.reject(new Error('No materialized view exists with the name "unscored"'))
    )

    lambda.handler(null).then((message) => {
      done.fail()
    }).catch((error) => {
      expect(error).not.toBeNull()
      expect(error).toEqual(new Error('No materialized view exists with the name "unscored"'))
      done()
    })
  })
})
