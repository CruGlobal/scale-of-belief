'use strict'

const ScoreController = require('../../api/controllers/score.js')
const factory = require('../factory')
const Score = require('../../models/score')

describe('ScoreController', () => {
  let score
  beforeEach(() => {
    return factory.build('existing_score').then(existingScore => { score = existingScore })
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

    test('should return score even if the client sends query parameters', done => {
      var request = {
        query: {
          uri: score.uri + '?some=value'
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
      expect(Score.retrieve).toHaveBeenCalledWith(score.uri)
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

  describe('saves one score', () => {
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

    afterEach(() => {
      return Score.destroy({truncate: true})
    })

    test('should create a new score', done => {
      const newUri = 'http://somewhere.com/1'
      const newScore = {
        unaware: 1,
        curious: 5,
        follower: 3,
        guide: 1,
        confidence: 98
      }
      const request = {
        body: {
          uri: newUri,
          score: newScore
        }
      }
      const result = [ createdScore, true ]

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual(request.body)
          done()
        }
      }

      jest.spyOn(Score, 'save').mockImplementation(() => Promise.resolve(result))

      ScoreController.post(request, response)
    })

    test('should update an existing score', done => {
      const newScore = {
        unaware: 2,
        curious: 2,
        follower: 2,
        guide: 2,
        confidence: 50
      }
      const request = {
        body: {
          uri: score.uri,
          score: newScore
        }
      }
      const result = [ updatedScore, true ]

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual(request.body)
          done()
        }
      }

      jest.spyOn(Score, 'save').mockImplementation(() => Promise.resolve(result))

      ScoreController.post(request, response)
    })

    test('should save score without query parameters', done => {
      const newUri = 'http://somewhere.com/1'
      const queryParams = '?q1=v1&q2=v2'
      const newScore = {
        unaware: 1,
        curious: 5,
        follower: 3,
        guide: 1,
        confidence: 98
      }
      const request = {
        body: {
          uri: newUri + queryParams,
          score: newScore
        }
      }
      const expectedJson = {
        uri: newUri,
        score: newScore
      }
      const result = [ createdScore, true ]

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual(expectedJson)
          done()
        }
      }

      jest.spyOn(Score, 'save').mockImplementation(() => Promise.resolve(result))

      ScoreController.post(request, response)
      expect(Score.save).toHaveBeenCalledWith(newUri, newScore)
    })
  })
})
