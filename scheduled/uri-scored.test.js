'use strict'

const lambda = require('./uri-scored')
const requestMock = require('request-promise-native')
const {Client} = require('pg')

jest.mock('pg', () => ({
    Client: jest.fn()
  }))

describe('uri-scored', () => {
  it('Should be defined', () => {
    expect(lambda).toBeDefined()
  })

  describe('success in copy to s3', () => {
    it('should succeed', async () => {
      requestMock.mockResolvedValueOnce({hits: []})
      expect.assertions(1)
      await expect(lambda.handler()).resolves.not.toBeNull()
    })
  })
})
