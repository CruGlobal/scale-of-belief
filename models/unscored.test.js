'use strict'

const Unscored = require('./unscored')
const factory = require('../test/factory')
const { omit } = require('lodash')
const paperTrail = require('../config/papertrail')
const Revisions = paperTrail['revisions']

describe('Unscored', () => {
  it('should be defined', () => {
    expect(Unscored).toBeDefined()
  })

  // created by: jonahktjala
  describe('Unscored.toScoreObject()', () => {
    let unscoredUri
    beforeEach(() => {
      return factory.create('existing_unscored').then(existingUnscored => { unscoredUri = existingUnscored })
    })

    test('should return formatted object', () => {
      const expectedApiScore = {
        uri: unscoredUri.uri,
        score: -1,
        weight: 0
      }
      expect.assertions(3)
      expect(unscoredUri).toBeDefined()
      return Unscored.toScoreObject(unscoredUri).then((result) => {
        const exclude = ['last_refreshed']
        expect(result).toBeDefined()
        expect(result).not.toBeNull()
        expect(omit(result, exclude)).toEqual(expectedApiScore)
      })
    })
  })

  // created by: jonahktjala
  describe('Unscored.getAllUris()', () => {
    let score
    beforeEach(() => {
      return factory.create('existing_score').then(existingScore => { score = existingScore })
    })

    it('should not return a null array of scored objects', () => {
      return Unscored.getAllUris().then((result) => {
        // make sure that output is not null
        expect(result).not.toBeNull()
        expect(result).toBeDefined()
        let oneEntry = result[0]

        // check that property values are not null
        const exclude = ['revision']
        expect(oneEntry).toBeDefined()
        expect(oneEntry).not.toBeNull()
        expect(oneEntry).toHaveProperty(omit(score.dataValues, exclude).keys())
      })
    })
  })

  afterAll(() => {
    Revisions.destroy({truncate: true})
  })
})
