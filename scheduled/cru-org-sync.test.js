'use strict'

const lambda = require('./cru-org-sync')
const sequelize = require('../config/sequelize')()
const factory = require('../test/factory')
const requestMock = require('request-promise-native')
const path = require('path')
const fs = require('fs')
const Recommendation = require('../models/recommendation')

describe('Cru.org Recommendations Sync', () => {
  it('Should be defined', () => {
    expect(lambda).toBeDefined()
  })

  describe('no existing scores', () => {
    it('should succeed', async () => {
      requestMock.mockResolvedValueOnce({ hits: [] })
      expect.assertions(1)
      await expect(lambda.handler()).resolves.toEqual('Successfully synced 0 recommendations.')
    })
  })

  describe('existing scores', () => {
    beforeEach(async () => {
      await Promise.all([
        factory.create('existing_score', { uri: 'https://www.cru.org/us/en/foo.html' }),
        factory.create('existing_score', { uri: 'https://www.cru.org/fr/fr/bar.html' }),
        factory.create('existing_score', { uri: 'missionhub://action/value' }),
        factory.create('existing_score', { uri: 'https://example.com/foo' }),
        factory.create('existing_score', { uri: 'https://www.cru.org/us/en/opportunities/mission-trips/summer/learn/why-cru-summer-missions.html' }),
        factory.create('existing_score', { uri: 'https://www.cru.org/us/en/how-to-know-god/prayer-request-form/prayer.html' }),
        factory.create('existing_score', { uri: 'https://www.cru.org/baz.js' }),
        factory.create('existing_score', { uri: 'https://www.cru.org/unknown.html' })
      ])
    })

    it('should sync cru.org recommendations', async () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'cru-org-json', 'builder.json'), 'utf-8')
      requestMock.mockImplementation(() => Promise.resolve(JSON.parse(data)))
      expect.assertions(5)
      await expect(lambda.handler()).resolves.toEqual('Successfully synced 4 recommendations.')
      const foo = await Recommendation.findById('3035db7cbf0a42265b6ca6ef510ea839')
      const bar = await Recommendation.findById('8085a00d57d8a816965c529ea38a3452')
      const missions = await Recommendation.findById('026791dbc4182de901368532db286881')
      const prayer = await Recommendation.findById('9a898e56445dffc08e38720db264d914')
      expect(foo.toJSON()).toEqual({
        url: 'https://www.cru.org/us/en/foo.html',
        categories: [],
        id: '3035db7cbf0a42265b6ca6ef510ea839',
        score: 5,
        title: 'Volunteer Profiles',
        message: 'Harry and I retired in 1981 after 28 years of Navy life.',
        language: 'en',
        thumbnail_url: null
      })
      expect(bar.toJSON()).toEqual({
        url: 'https://www.cru.org/fr/fr/bar.html',
        categories: [],
        id: '8085a00d57d8a816965c529ea38a3452',
        score: 5,
        title: 'What\'s Involved in Preparing for STINT?',
        message: '(Short Term International)',
        language: 'fr',
        thumbnail_url: null
      })
      expect(missions.toJSON()).toEqual({
        url: 'https://www.cru.org/us/en/opportunities/mission-trips/summer/learn/why-cru-summer-missions.html',
        categories: ['opportunities', 'mission-trips', 'summer', 'learn'],
        id: '026791dbc4182de901368532db286881',
        score: 5,
        title: 'Why Summer Missions with Cru?',
        thumbnail_url: 'https://www.cru.org/us/en/opportunities/mission-trips/summer/learn/why-cru-summer-missions/_jcr_content/image.transform/CruHalf432x243/img.png',
        language: 'en',
        message: null
      })
      expect(prayer.toJSON()).toEqual({
        url: 'https://www.cru.org/us/en/how-to-know-god/prayer-request-form/prayer.html',
        categories: ['how-to-know-god', 'prayer-request-form'],
        id: '9a898e56445dffc08e38720db264d914',
        score: 5,
        title: 'How Can We Pray for You?',
        language: 'en',
        thumbnail_url: null,
        message: null
      })
    })

    it('should sync cru.org recommendations if pub1 is down', async () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'cru-org-json', 'builder.json'), 'utf-8')
      requestMock
        .mockImplementationOnce(() => Promise.reject(new Error('502 Timeout')))
        .mockImplementationOnce(() => Promise.resolve(JSON.parse(data)))
      expect.assertions(1)
      const result = await lambda.handler()
      expect(result).toEqual('Successfully synced 4 recommendations.')
    })
  })

  it('should throw an error', async () => {
    const transactionMock = {
      connection: sequelize.connectionManager.getConnection(),
      rollback: jest.fn().mockImplementation(() => Promise.resolve())
    }
    jest.spyOn(sequelize, 'transaction').mockImplementation(() => Promise.resolve(transactionMock))
    requestMock.mockResolvedValueOnce({ hits: [] })
    jest.spyOn(Recommendation, 'truncate').mockImplementation(() => Promise.reject(new Error('Database Error')))
    expect.assertions(2)
    await expect(lambda.handler()).rejects.toThrow('Database Error')
    expect(transactionMock.rollback).toHaveBeenCalledTimes(1)
  })
})
