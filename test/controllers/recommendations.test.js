'use strict'

jest.mock('../../models/placement')
const controller = require('../../api/controllers/recommendations')
const User = require('../../models/user')
const Placement = require('../../models/placement')
const Recommendation = require('../../models/recommendation')

describe('Recommendations controller', () => {
  let response
  beforeEach(() => {
    response = {
      status: jest.fn(),
      json: jest.fn(),
      render: jest.fn()
    }
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('without query params', () => {
    describe('without \'entity.id\'', () => {
      it('should return 404 Not Found', async () => {
        expect.assertions(2)
        await controller.get({query: {}}, response)
        expect(response.status).toHaveBeenCalledWith(404)
        expect(response.json).toHaveBeenCalledWith({message: 'Not Found'})
      })
    })

    describe('without \'profile.mcid\'', () => {
      it('should return 404 Not Found', async () => {
        jest.spyOn(Recommendation, 'findById').mockImplementation(() => Promise.resolve(new Recommendation({id: 'abc123'})))
        expect.assertions(2)
        await controller.get({query: {'entity.id': 'abc123'}}, response)
        expect(response.status).toHaveBeenCalledWith(404)
        expect(response.json).toHaveBeenCalledWith({message: 'Not Found'})
      })
    })
  })

  describe('user has no placement', () => {
    it('should return 404 Not Found', async () => {
      jest.spyOn(Recommendation, 'findById').mockResolvedValue(new Recommendation({id: 'abc123'}))
      jest.spyOn(User, 'findOne').mockResolvedValue(new User({id: 123456, mcid: ['809xyz']}))
      Placement.mockImplementation(() => {
        return {
          calculate: jest.fn().mockResolvedValue({placement: null})
        }
      })
      expect.assertions(2)
      await controller.get({query: {'entity.id': 'abc123', 'profile.mcid': '809xyz'}}, response)
      expect(response.status).toHaveBeenCalledWith(404)
      expect(response.json).toHaveBeenCalledWith({message: 'Not Found'})
    })
  })

  describe('no recommendations', () => {
    it('should return 404 Not Found', async () => {
      const recommendedSpy = jest.fn()
      jest.spyOn(Recommendation, 'findById').mockResolvedValue({findRecommended: recommendedSpy})
      jest.spyOn(User, 'findOne').mockResolvedValue(new User({id: 123456, mcid: ['809xyz']}))
      Placement.mockImplementation(() => {
        return {
          calculate: jest.fn().mockResolvedValue({placement: 6})
        }
      })
      recommendedSpy.mockImplementation(() => Promise.resolve([]))
      expect.assertions(2)
      await controller.get({query: {'entity.id': 'abc123', 'profile.mcid': '809xyz'}}, response)
      expect(response.status).toHaveBeenCalledWith(404)
      expect(response.json).toHaveBeenCalledWith({message: 'Not Found'})
    })
  })

  describe('has recommendations', () => {
    it('should render recommendations', async () => {
      const recommendedSpy = jest.fn()
      const page = {findRecommended: recommendedSpy, category: 'A Category'}
      jest.spyOn(Recommendation, 'findById').mockResolvedValue(page)
      jest.spyOn(User, 'findOne').mockResolvedValue(new User({id: 123456, mcid: ['809xyz']}))
      Placement.mockImplementation(() => {
        return {
          calculate: jest.fn().mockResolvedValue({placement: 6})
        }
      })
      recommendedSpy.mockImplementation(() => Promise.resolve([1, 2, 3]))
      expect.assertions(1)
      await controller.get({query: {'entity.id': 'abc123', 'profile.mcid': '809xyz'}}, response)
      expect(response.render).toHaveBeenCalledWith('recommendations', {current: page, recommendations: [1, 2, 3]})
    })
  })

  describe('unknown error', () => {
    it('should return 500 Internal Server Error', async () => {
      jest.spyOn(Recommendation, 'findById').mockImplementation(() => Promise.reject(new Error('Database Error')))
      expect.assertions(2)
      await controller.get({query: {}}, response)
      expect(response.status).toHaveBeenCalledWith(500)
      expect(response.json).toHaveBeenCalledWith({error: 'Database Error', message: 'Internal Server Error'})
    })
  })
})
