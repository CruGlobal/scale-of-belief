'use strict'

const Placement = require('./placement')
const sequelize = require('../config/sequelize')
// const factory = require('../test/factory')

describe('Placement', () => {
  it('should be defined', () => {
    expect(Placement).toBeDefined()
  })

  describe('constructor', () => {
    it('should accept user', () => {
      const placement = new Placement({ id: 123 })
      expect(placement.user).toEqual({ id: 123 })
    })
  })

  describe('placement getter', () => {
    it('should return \'null\' by default', () => {
      const placement = new Placement({ id: 234 })
      expect(placement.placement).toEqual(null)
    })

    it('should return placement value', () => {
      const placement = new Placement({ id: 345 })
      placement._placement = 5
      expect(placement.placement).toEqual(5)
    })
  })

  describe('calculate()', () => {
    it('should calculate placement', () => {
      jest.spyOn(sequelize(), 'query').mockImplementation(() => Promise.resolve([{ placement: 7 }]))

      const placement = new Placement({ id: 123 })
      return placement.calculate().then(p => {
        expect(p).toEqual(placement)
        expect(p._placement).toEqual(7)
      })
    })
  })
})
