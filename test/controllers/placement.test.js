'use strict'

jest.mock('../../models/placement')
const controller = require('../../api/controllers/placement')
const User = require('../../models/user')
const Placement = require('../../models/placement')

describe('Placement controller', () => {
  let response
  beforeEach(() => {
    response = {
      status: jest.fn(),
      json: jest.fn()
    }
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('without query params', () => {
    it('should return 400 Bad Request', (done) => {
      expect.assertions(3)

      response.json.mockImplementation(json => {
        expect(json).toBeDefined()
        expect(json.message).toEqual('Requires at least on query parameter.')
        done()
      })

      response.status.mockImplementation(status => {
        expect(status).toEqual(400)
      })

      controller.get({query: []}, response)
    })
  })

  describe('user not found', () => {
    it('should return 404 Not Found', (done) => {
      expect.assertions(3)

      response.json.mockImplementation(json => {
        expect(json).toBeDefined()
        expect(json.message).toEqual('Not Found')
        done()
      })

      response.status.mockImplementation(status => {
        expect(status).toEqual(404)
      })

      jest.spyOn(User, 'findOne').mockResolvedValue(null)

      controller.get({query: {mcid: '1234'}}, response)
    })
  })

  describe('error finding user', () => {
    it('should return 400 error', (done) => {
      expect.assertions(3)

      response.json.mockImplementation(json => {
        expect(json).toBeDefined()
        expect(json.message).toEqual('error message')
        done()
      })

      response.status.mockImplementation(status => {
        expect(status).toEqual(400)
      })

      jest.spyOn(User, 'findOne').mockRejectedValue(new Error('error message'))

      controller.get({query: {mcid: '1234'}}, response)
    })
  })

  describe('user without placement', () => {
    it('should return null placement value', (done) => {
      expect.assertions(2)

      response.json.mockImplementation(json => {
        expect(json).toBeDefined()
        expect(json).toEqual({placement: null})
        done()
      })

      jest.spyOn(User, 'findOne').mockResolvedValue({id: 2345})

      Placement.mockImplementation(() => {
        return {
          calculate: jest.fn().mockResolvedValue({placement: null})
        }
      })

      controller.get({query: {mcid: '1234'}}, response)
    })
  })

  describe('error calculating placement', () => {
    it('should return 400 error', (done) => {
      expect.assertions(3)

      response.json.mockImplementation(json => {
        expect(json).toBeDefined()
        expect(json.message).toEqual('some error')
        done()
      })

      response.status.mockImplementation(status => {
        expect(status).toEqual(400)
      })

      jest.spyOn(User, 'findOne').mockResolvedValue({id: 2345})

      Placement.mockImplementation(() => {
        return {
          calculate: jest.fn().mockRejectedValue(new Error('some error'))
        }
      })

      controller.get({query: {mcid: '1234'}}, response)
    })
  })

  describe('user with placement', () => {
    it('should return placement value', (done) => {
      expect.assertions(2)

      response.json.mockImplementation(json => {
        expect(json).toBeDefined()
        expect(json).toEqual({placement: 7})
        done()
      })

      jest.spyOn(User, 'findOne').mockResolvedValue({id: 2345})

      Placement.mockImplementation(() => {
        return {
          calculate: jest.fn().mockResolvedValue({placement: 7})
        }
      })

      controller.get({query: {mcid: '1234'}}, response)
    })
  })
})
