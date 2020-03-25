'use strict'

const Score = require('./score')
const factory = require('../test/factory')
const { omit } = require('lodash')
const paperTrail = require('../config/papertrail')
const Revisions = paperTrail['revisions']

describe('Score', () => {
  it('should be defined', () => {
    expect(Score).toBeDefined()
  })

  describe('Score.toApiScore()', () => {
    it('should create a json object', () => {
      const dbScore = {
        uri: 'http://somewhere.com',
        score: 2,
        weight: 3
      }

      const expectedApiScore = {
        uri: dbScore.uri,
        score: dbScore.score,
        weight: dbScore.weight
      }

      const apiScore = Score.toApiScore(dbScore)
      expect(apiScore).toBeDefined()
      expect(apiScore).toEqual(expectedApiScore)
    })
  })

  // created by: jonahktjala
  describe('Score.toScoreObject()', () => {
    it('should create a json object', () => {
      const scoreObject = {
        uri: 'http://somewhere.com',
        score: 2,
        weight: 3,
        revision: 1
      }

      const expectedApiScore = {
        uri: scoreObject.uri,
        score: scoreObject.score,
        weight: scoreObject.weight
      }

      let toScoreObject = Score.toScoreObject(scoreObject)
      expect(toScoreObject).toBeDefined()
      expect(toScoreObject).toEqual(expectedApiScore)
    })
  })

  // created by: jonahktjala
  describe('Score.getAllScores()', () => {
    it('should not return a null array of scored objects', () => {
      expect.assertions(4)
      return Score.getAllScores().then((result) => {
        // make sure that output is not null
        expect(result).not.toBeNull()
        expect(result).toBeDefined()

        // make sure it does not contain blacklisted items
        expect.extend({
          toContainObject (received, argument) {
            const pass = this.equals(received,
              expect.arrayContaining([
                expect.objectContaining(argument)
              ]))

            if (pass) {
              return {
                pass: true
              }
            } else {
              return {
                pass: false
              }
            }
          }
        })
        expect(result).not.toContainObject({uri: '%apply.cru.org%'})
        expect(result).not.toContainObject({uri: '%mpdx.org%'})
      })
    })
  })

  describe('Score.retrieve()', () => {
    let score
    beforeEach(() => {
      return factory.create('existing_score').then(existingScore => { score = existingScore })
    })

    xit('should return an existing score', () => {
      expect.assertions(5)
      expect(score).toBeDefined()
      expect(score).not.toBeNull()
      return Score.retrieve(score.uri).then((result) => {
        expect(result).toBeDefined()
        expect(result).not.toBeNull()
        const exclude = ['created_at', 'updated_at', 'revision']
        expect(omit(result.dataValues, exclude)).toEqual(omit(score.dataValues, exclude))
      })
    })

    it('should not return an existing score', () => {
      expect.assertions(1)
      return Score.retrieve('http://random.uri.com').then((result) => {
        expect(result).toBeNull()
      })
    })
  })

  describe('Score.save()', () => {
    let createdScore, updatedScore
    beforeEach(() => {
      return Promise.all([
        factory.build('created_score'),
        factory.build('updated_score')
      ]).then(scores => {
        createdScore = scores[0]
        updatedScore = scores[1]
      })
    })

    it('should create a new score', done => {
      const inputScore = {
        score: createdScore.score,
        weight: createdScore.weight
      }
      Score.save(createdScore.uri, inputScore).then((result) => {
        expect(result).toBeDefined()
        expect(result.dataValues.uri).toEqual(createdScore.dataValues.uri)
        expect(result.dataValues.score).toEqual(createdScore.dataValues.score)
        expect(result.dataValues.weight).toEqual(createdScore.dataValues.weight)
        done()
      })
    })

    it('should update an existing score', done => {
      const inputScore = {
        score: updatedScore.score,
        weight: updatedScore.weight
      }

      factory.create('existing_score').then((existingScore) => {
        expect(existingScore).toBeDefined()

        Score.save(existingScore.uri, inputScore).then((result) => {
          expect(result).toBeDefined()
          expect(result.dataValues.uri).toEqual(existingScore.dataValues.uri)

          expect(result.dataValues.score).toEqual(updatedScore.dataValues.score)
          expect(result.dataValues.score).not.toEqual(existingScore.dataValues.score)

          expect(result.dataValues.weight).toEqual(updatedScore.dataValues.weight)
          expect(result.dataValues.weight).not.toEqual(existingScore.dataValues.weight)
          done()
        })
      })
    })

    it('should fail if saving with a null URI', done => {
      const inputScore = {
        score: updatedScore.score,
        weight: updatedScore.weight
      }

      Score.save(null, inputScore).then((result) => {
        done.fail(new Error('Save should have had an error'))
      }).catch((error) => {
        expect(error).toBeDefined()
        done()
      })
    })
  })

  describe('Score.getPrimaryKey()', () => {
    let score
    beforeEach(() => {
      return factory.build('existing_score').then(existingScore => { score = existingScore })
    })

    it('should return the uri', () => {
      const primaryKey = score.get('primaryKey')
      expect(primaryKey).toEqual(score.uri)
    })
  })

  afterAll(() => {
    Revisions.destroy({truncate: true})
  })
})
