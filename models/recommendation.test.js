'use strict'

const Recommendation = require('./recommendation')
const sequelize = require('../config/sequelize')()

describe('Recommendation', () => {
  it('should be defined', () => {
    expect(Recommendation).toBeDefined()
  })

  describe('category', () => {
    it('should return last category with title caps applied', () => {
      let rec = new Recommendation({categories: ['category-one', 'category-two', 'category-three']})
      expect(rec.category).toEqual('Category Three')
    })

    it('should return default category if categories is empty', () => {
      let rec = new Recommendation()
      expect(rec.category).toEqual('Cru.org')
    })
  })

  describe('findRecommended()', () => {
    it('executes the recommended query', async () => {
      const recommendation = new Recommendation({categories: ['category-one', 'category-two', 'category-three']})
      const querySpy = jest.spyOn(sequelize, 'query').mockImplementation(() => Promise.resolve([]))
      expect.assertions(2)
      await recommendation.findRecommended(6)
      expect(querySpy).toHaveBeenCalledTimes(1)
      expect(querySpy.mock.calls[0][1]).toEqual({
        model: Recommendation,
        replacements: {placement: 6, categories: recommendation.categories},
        type: 'SELECT'
      })
    })
  })
})
