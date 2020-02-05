'use strict'

const Unscored = require('./unscored')
const paperTrail = require('../config/papertrail')
const Revisions = paperTrail['revisions']

describe('Unscored', () => {
  it('should be defined', () => {
    expect(Unscored).toBeDefined()
  })

  // created by: jonahktjala
  describe('Unscored.toScoreObject()', () => {
    it('should create a json object', () => {
      const unscoredUri = {
        uri: 'http://someuri.com',
        last_refreshed: new Date()
      }
      const expectedApiScore = {
        uri: unscoredUri.uri,
        score: -1,
        weight: 0
      }
      const unscored = Unscored.toScoreObject(unscoredUri)
      expect(unscored).toBeDefined()
      expect(unscored).toEqual(expectedApiScore)
    })
  })

  // created by: jonahktjala
  describe('Unscored.getAllUris() matching https', () => {
    const expected = [
      expect.stringMatching('^(http|https)://')
    ]
    test('Unscored.getAllUris valid and not null', () => {
      return Unscored.getAllUris().then(result => {
        // make sure that output is not null
        expect(result).toBeDefined()
        // make sure it contains https
        expect(result).toEqual(
          expect.arrayContaining(expected)
        )
      })
    })
  })

  afterAll(() => {
    Revisions.destroy({truncate: true})
  })
})
