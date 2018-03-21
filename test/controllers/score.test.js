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
    test('should return the score to the client', done => {
      var request = {
        query: {
          uri: score.uri
        }
      }

      var response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual(Score.toApiScore(score))
          done()
        }
      }

      jest.spyOn(Score, 'retrieve').mockImplementation(() => Promise.resolve(score))

      ScoreController.get(request, response)
    })
  })

  describe('has no matches', () => {
    test('should return not found to the client', done => {
      var request = {
        query: {
          uri: 'http://nowhere.com'
        }
      }

      var response = {
        status: (statusToSet) => {
          expect(statusToSet).toBeDefined()
          expect(statusToSet).toEqual(404)
        },
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual({ message: 'Not Found' })
          done()
        }
      }

      jest.spyOn(Score, 'retrieve').mockImplementation(() => Promise.resolve(null))

      ScoreController.get(request, response)
    })
  })
})
