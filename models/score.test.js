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
    it('should create a json object with a "score" sub-object', () => {
      const dbScore = {
        uri: 'http://somewhere.com',
        unaware: 2,
        curious: 3,
        follower: 1,
        guide: 2,
        confidence: 50
      }

      const expectedApiScore = {
        uri: dbScore.uri,
        score: {
          unaware: dbScore.unaware,
          curious: dbScore.curious,
          follower: dbScore.follower,
          guide: dbScore.guide,
          confidence: dbScore.confidence
        }
      }

      const apiScore = Score.toApiScore(dbScore)
      expect(apiScore).toBeDefined()
      expect(apiScore).toEqual(expectedApiScore)
    })
  })

  describe('Score.retrieve()', () => {
    let score
    beforeEach(() => {
      return factory.create('existing_score').then(existingScore => { score = existingScore })
    })

    it('should return an existing score', () => {
      expect.assertions(3)
      expect(score).toBeDefined()
      return Score.retrieve(score.uri).then((result) => {
        expect(result).toBeDefined()
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
    let existingScore, createdScore, updatedScore
    beforeEach(() => {
      return Promise.all([
        factory.build('existing_score'),
        factory.build('created_score'),
        factory.build('updated_score')
      ]).then(scores => {
        existingScore = scores[0]
        createdScore = scores[1]
        updatedScore = scores[2]
      })
    })

    it('should create a new score', done => {
      const inputScore = {
        unaware: createdScore.unaware,
        curious: createdScore.curious,
        follower: createdScore.follower,
        guide: createdScore.guide,
        confidence: createdScore.confidence
      }
      Score.save(createdScore.uri, inputScore).then((result) => {
        expect(result).toBeDefined()
        expect(result[0].dataValues.uri).toEqual(createdScore.dataValues.uri)
        expect(result[0].dataValues.unaware).toEqual(createdScore.dataValues.unaware)
        expect(result[0].dataValues.curious).toEqual(createdScore.dataValues.curious)
        expect(result[0].dataValues.follower).toEqual(createdScore.dataValues.follower)
        expect(result[0].dataValues.guide).toEqual(createdScore.dataValues.guide)
        expect(result[0].dataValues.confidence).toEqual(createdScore.dataValues.confidence)
        done()
      })
    })

    it('should update an existing score', done => {
      const inputScore = {
        unaware: updatedScore.unaware,
        curious: updatedScore.curious,
        follower: updatedScore.follower,
        guide: updatedScore.guide,
        confidence: updatedScore.confidence
      }
      Score.save(existingScore.uri, inputScore).then((result) => {
        expect(result).toBeDefined()
        expect(result[0].dataValues.uri).toEqual(existingScore.dataValues.uri)

        expect(result[0].dataValues.unaware).toEqual(updatedScore.dataValues.unaware)
        expect(result[0].dataValues.unaware).not.toEqual(existingScore.dataValues.unaware)

        expect(result[0].dataValues.curious).toEqual(updatedScore.dataValues.curious)
        expect(result[0].dataValues.curious).not.toEqual(existingScore.dataValues.curious)

        expect(result[0].dataValues.follower).toEqual(updatedScore.dataValues.follower)
        expect(result[0].dataValues.follower).not.toEqual(existingScore.dataValues.follower)

        expect(result[0].dataValues.guide).toEqual(updatedScore.dataValues.guide)
        expect(result[0].dataValues.guide).not.toEqual(existingScore.dataValues.guide)

        expect(result[0].dataValues.confidence).toEqual(updatedScore.dataValues.confidence)
        expect(result[0].dataValues.confidence).not.toEqual(existingScore.dataValues.confidence)
        done()
      })
    })

    it('should fail if saving with a null URI', done => {
      const inputScore = {
        unaware: updatedScore.unaware,
        curious: updatedScore.curious,
        follower: updatedScore.follower,
        guide: updatedScore.guide,
        confidence: updatedScore.confidence
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
