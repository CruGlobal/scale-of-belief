'use strict'

const ScoresController = require('../../api/controllers/scores.js')
const factory = require('../factory')
const Score = require('../../models/score')

describe('ScoresController', () => {
  let score1, score2
  beforeEach(() => {
    return Promise.all([
      factory.build('existing_score'),
      factory.build('blank_score', {
        uri: 'http://some.other.uri.com',
        score: 3,
        weight: 8
      })
    ]).then(scores => {
      score1 = scores[0]
      score2 = scores[1]
    })
  })

  test('is defined', () => {
    expect(ScoresController).toBeDefined()
  })

  describe('has one match', () => {
    test('should return the score to the client', done => {
      var request = {
        query: {
          uri: 'http://some.uri'
        }
      }

      var response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual({
            data: [Score.toApiScore(score1)],
            meta: {
              total: 1
            }
          })
          done()
        }
      }

      jest.spyOn(Score, 'findAndCountAll').mockImplementation(() => Promise.resolve({rows: [score1], count: 1}))

      ScoresController.get(request, response)
    })
  })

  describe('has multiple matches', () => {
    test('should return the scores to the client', done => {
      var request = {
        query: {
          uri: 'http://some'
        }
      }

      var response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual({
            data: [Score.toApiScore(score1), Score.toApiScore(score2)],
            meta: {
              total: 2
            }
          })
          done()
        }
      }

      jest.spyOn(Score, 'findAndCountAll').mockImplementation(() => Promise.resolve({rows: [score1, score2], count: 2}))

      ScoresController.get(request, response)
    })
  })

  describe('has no matches', () => {
    test('should return an empty array to the client', done => {
      var request = {
        query: {
          uri: 'http://nowhere.com'
        }
      }

      var response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual({
            data: [],
            meta: {
              total: 0
            }
          })
          done()
        }
      }

      jest.spyOn(Score, 'findAndCountAll').mockImplementation(() => Promise.resolve({rows: [], count: 0}))

      ScoresController.get(request, response)
    })
  })
})
