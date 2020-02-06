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
    test('Unscored.getAllUris valid and not null', () => {
      return Unscored.getAllUris().then(result => {
        // make sure that output is not null
        expect(result).toBeDefined()
        // make sure it does not contain blacklisted items
        expect.extend({
          toContainObject(received, argument){
            const pass = this.equals(received,
              expect.arrayContaining([
                expect.objectContaining(argument)
              ]))

            if (pass) {
              return{
                pass: true
              }
            }
            else {
              return{
                pass: false
              }
            }
          }
        })
        expect(result).not.toContainObject({uri:'%apply.cru.org%'})
        expect(result).not.toContainObject({uri:'%mpdx.org%'})
      })
    })
  })

  afterAll(() => {
    Revisions.destroy({truncate: true})
  })
})
