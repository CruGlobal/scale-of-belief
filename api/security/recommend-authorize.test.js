'use strict'

const ApiKey = require('../../models/api-key')
const Recommendation = require('../../models/recommendation')
const Authorizer = require('./recommend-authorize')

describe('Recommendation Authorize', () => {
  it('should be defined', () => {
    expect(Authorizer).toBeDefined()
  })

  describe('missing required query parameters', () => {
    describe('missing all parameters', () => {
      it('should fail with Unauthorized', async () => {
        const nextMock = jest.fn()

        expect.assertions(2)
        await Authorizer({query: {}}, {}, nextMock)
        expect(nextMock).toHaveBeenCalledWith(expect.any(Error))
        expect(nextMock.mock.calls[0][0].message).toEqual('Unauthorized')
      })
    })

    describe('missing \'apiKey\' query parameter', () => {
      it('should fail with Unauthorized', async () => {
        const nextMock = jest.fn()

        expect.assertions(2)
        await Authorizer({query: {'entity.id': 'abc123'}}, {}, nextMock)
        expect(nextMock).toHaveBeenCalledWith(expect.any(Error))
        expect(nextMock.mock.calls[0][0].message).toEqual('Unauthorized')
      })
    })

    describe('missing \'entity.id\' query parameter', () => {
      it('should fail with Unauthorized', async () => {
        const nextMock = jest.fn()

        expect.assertions(2)
        await Authorizer({query: {apiKey: 'a1b2c3'}}, {}, nextMock)
        expect(nextMock).toHaveBeenCalledWith(expect.any(Error))
        expect(nextMock.mock.calls[0][0].message).toEqual('Unauthorized')
      })
    })
  })

  describe('invalid query parameters', () => {
    describe('invalid \'apiKey\'', () => {
      it('should fail with Unauthorized', async () => {
        jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve(null))
        jest.spyOn(Recommendation, 'findOne').mockImplementation(() => Promise.resolve({}))
        const nextMock = jest.fn()

        expect.assertions(2)
        await Authorizer({query: {apiKey: 'a1b2c3', 'entity.id': 'abc123'}}, {}, nextMock)
        expect(nextMock).toHaveBeenCalledWith(expect.any(Error))
        expect(nextMock.mock.calls[0][0].message).toEqual('Unauthorized')
      })
    })

    describe('invalid \'entity.id\'', () => {
      it('should fail with Unauthorized', async () => {
        jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve({}))
        jest.spyOn(Recommendation, 'findOne').mockImplementation(() => Promise.resolve(null))
        const nextMock = jest.fn()

        expect.assertions(2)
        await Authorizer({query: {apiKey: 'a1b2c3', 'entity.id': 'abc123'}}, {}, nextMock)
        expect(nextMock).toHaveBeenCalledWith(expect.any(Error))
        expect(nextMock.mock.calls[0][0].message).toEqual('Unauthorized')
      })
    })
  })

  describe('valid \'apiKey\' and \'entity.id\'', () => {
    describe('super user \'apiKey\'', () => {
      it('should succeed', async () => {
        jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve({type: 'super'}))
        jest.spyOn(Recommendation, 'findOne').mockImplementation(() => Promise.resolve({}))
        const nextMock = jest.fn()

        expect.assertions(1)
        await Authorizer({query: {apiKey: 'a1b2c3', 'entity.id': 'abc123'}}, {}, nextMock)
        expect(nextMock).toHaveBeenCalledWith()
      })
    })

    describe('recommendation url doesn\'t match apiKey', () => {
      it('should fail with Unauthorized', async () => {
        jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve({type: '', api_pattern: ['^x.*']}))
        jest.spyOn(Recommendation, 'findOne').mockImplementation(() => Promise.resolve({url: 'abc123'}))
        const nextMock = jest.fn()

        expect.assertions(2)
        await Authorizer({query: {apiKey: 'a1b2c3', 'entity.id': 'abc123'}}, {}, nextMock)
        expect(nextMock).toHaveBeenCalledWith(expect.any(Error))
        expect(nextMock.mock.calls[0][0].message).toEqual('Unauthorized')
      })
    })

    describe('recommendation url matches apiKey pattern', () => {
      it('should succeed', async () => {
        jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.resolve({
          type: '',
          api_pattern: ['^x.*', '^a.*3$']
        }))
        jest.spyOn(Recommendation, 'findOne').mockImplementation(() => Promise.resolve({url: 'abc123'}))
        const nextMock = jest.fn()

        expect.assertions(1)
        await Authorizer({query: {apiKey: 'a1b2c3', 'entity.id': 'abc123'}}, {}, nextMock)
        expect(nextMock).toHaveBeenCalledWith()
      })
    })
  })

  describe('Internal Error', () => {
    it('should fail with Database Error', async () => {
      jest.spyOn(ApiKey, 'findOne').mockImplementation(() => Promise.reject(new Error('Database Error')))
      jest.spyOn(Recommendation, 'findOne').mockImplementation(() => Promise.resolve(null))
      const nextMock = jest.fn()

      expect.assertions(2)
      await Authorizer({query: {apiKey: 'a1b2c3', 'entity.id': 'abc123'}}, {}, nextMock)
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error))
      expect(nextMock.mock.calls[0][0].message).toEqual('Database Error')
    })
  })
})
