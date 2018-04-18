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
        unaware: 1,
        curious: 3,
        follower: 2,
        guide: 3,
        confidence: 75
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
          expect(jsonToSet).toEqual([Score.toApiScore(score1)])
          done()
        }
      }

      jest.spyOn(Score, 'findAll').mockImplementation(() => Promise.resolve([score1]))

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
          expect(jsonToSet).toEqual([Score.toApiScore(score1), Score.toApiScore(score2)])
          done()
        }
      }

      jest.spyOn(Score, 'findAll').mockImplementation(() => Promise.resolve([score1, score2]))

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
          expect(jsonToSet).toEqual([])
          done()
        }
      }

      jest.spyOn(Score, 'findAll').mockImplementation(() => Promise.resolve([]))

      ScoresController.get(request, response)
    })
  })
})
