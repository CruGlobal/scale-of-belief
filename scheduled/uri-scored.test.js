'use strict'

const lambda = require('./uri-scored')
const requestMock = require('request-promise-native')

describe('uri-scored', () => {
  it('Should be defined', () => {
    expect(lambda).toBeDefined()
  })

  describe('created csv in s3', () => {
    it('should succeed', async () => {
      requestMock.mockResolvedValueOnce({hits: []})
      expect.assertions(1)
      await expect(lambda.handler()).toHaveProperty('ETag');
    })
  })
  
  test('the fetch fails with an error', async () => {
    await expect(lambda.handler()).rejects.toThrow('error');
  });
})
