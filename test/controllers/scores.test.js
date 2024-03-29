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
      const request = {
        query: {
          uri: 'http://some.uri'
        }
      }

      const response = {
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

      jest.spyOn(Score, 'findAndCountAll').mockImplementation(() => Promise.resolve({ rows: [score1], count: 1 }))

      ScoresController.get(request, response)
    })
  })

  describe('has multiple matches', () => {
    test('should return the scores to the client', done => {
      const request = {
        query: {
          uri: 'http://some'
        }
      }

      const response = {
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

      jest.spyOn(Score, 'findAndCountAll').mockImplementation(() => Promise.resolve({ rows: [score1, score2], count: 2 }))

      ScoresController.get(request, response)
    })
  })

  describe('has no matches', () => {
    test('should return an empty array to the client', done => {
      const request = {
        query: {
          uri: 'http://nowhere.com'
        }
      }

      const response = {
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

      jest.spyOn(Score, 'findAndCountAll').mockImplementation(() => Promise.resolve({ rows: [], count: 0 }))

      ScoresController.get(request, response)
    })
  })

  describe('has more than one page of matches', () => {
    it('should return limited rows with a full count total', done => {
      const request = {
        query: {
          uri: 'http',
          page: '1',
          per_page: '1',
          order_by: 'uri',
          order: 'ASC'
        }
      }

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet.data).toEqual([Score.toApiScore(score1)])
          expect(jsonToSet.meta.total).toEqual(2)
          done()
        }
      }

      jest.spyOn(Score, 'findAndCountAll').mockImplementation(() => Promise.resolve({ rows: [score1], count: 2 }))
      ScoresController.get(request, response)
    })
  })
})
