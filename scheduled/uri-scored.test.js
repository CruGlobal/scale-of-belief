'use strict'

const lambda = require('./uri-scored')

jest.mock('pg', () => ({
  Client: jest.fn()
}))

describe('uri-scored', () => {
  it('Should be defined', () => {
    expect(lambda).toBeDefined()
  })

  describe('success in copy to s3', () => {
    it('should succeed', async () => {
      await expect(lambda.handler()).resolves.not.toBeNull()
    })
  })
})
