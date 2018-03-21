'use strict'

const ScoreController = require('../../api/controllers/score.js')
const factory = require('../factory')
const Score = require('../../models/score')

describe('ScoreController', () => {
  let score
  beforeEach(() => {
    return factory.build('basic_score').then(basicScore => { score = basicScore })
  })

  test('is defined', () => {
    expect(ScoreController).toBeDefined()
  })

  describe('has one match', () => {
    test('should get the score from the database', () => {
      jest.spyOn(Score, 'findOne').mockImplementation(() => Promise.resolve(score))

      expect.assertions(2)
      return ScoreController.retrieveScore(score.uri).then(returnedScore => {
        expect(returnedScore).toBeDefined()
        expect(returnedScore).toEqual(score)
      })
    })

    test('should return the score to the client', () => {
      var json = {}
      var status = 200

      var response = {
        status: (statusToSet) => {
          status = statusToSet
        },
        json: (jsonToSet) => {
          json = jsonToSet
        }
      }

      ScoreController.handleGetResponse(score, response)

      expect(status).toEqual(200)
      expect(json).toEqual(Score.toApiScore(score))
    })
  })

  describe('has no matches', () => {
    test('should not get a score from the database', () => {
      jest.spyOn(Score, 'findOne').mockImplementation(() => Promise.resolve(null))

      expect.assertions(1)
      return ScoreController.retrieveScore('http://nowhere.com').then(returnedScore => {
        expect(returnedScore).toBe(null)
      })
    })

    test('should return not found to the client', () => {
      var json = {}
      var status = 200

      var response = {
        status: (statusToSet) => {
          status = statusToSet
        },
        json: (jsonToSet) => {
          json = jsonToSet
        }
      }

      ScoreController.handleGetResponse(null, response)

      expect(status).toEqual(404)
      expect(json).toEqual({ message: 'Not Found' })
    })
  })
})
