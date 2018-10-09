'use strict'

const ScoreController = require('../../api/controllers/score.js')
const factory = require('../factory')
const Score = require('../../models/score')
const RecentlyScored = require('../../models/recently-scored')
const AWS = require('aws-sdk')

describe('ScoreController', () => {
  let score
  beforeEach(() => {
    jest.spyOn(RecentlyScored, 'save').mockImplementationOnce(() => Promise.resolve())
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
          expect(jsonToSet).toEqual({message: 'Not Found'})
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
        score: 1,
        weight: 6
      }
      const request = {
        body: Object.assign({uri: newUri}, newScore)
      }

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual(request.body)
          done()
        }
      }

      jest.spyOn(Score, 'save').mockImplementation(() => Promise.resolve(createdScore))

      ScoreController.post(request, response)
    })

    test('should update an existing score', done => {
      const newScore = {
        score: 2,
        weight: 1
      }
      const request = {
        body: Object.assign({uri: score.uri}, newScore)
      }
      const result = [2, [updatedScore, true]]

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
        score: 1,
        weight: 6
      }
      const request = {
        body: Object.assign({
          uri: newUri + queryParams
        }, newScore)
      }
      const expectedJson = Object.assign({
        uri: newUri
      }, newScore)

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual(expectedJson)
          done()
        }
      }

      jest.spyOn(Score, 'save').mockImplementation(() => Promise.resolve(createdScore))

      ScoreController.post(request, response)
      expect(Score.save).toHaveBeenCalledWith(newUri, newScore)
    })

    test('should save to recently_scored as well', done => {
      const newUri = 'http://somewhere.com/1'
      const newScore = {
        score: 1,
        weight: 6
      }
      const request = {
        body: Object.assign({uri: newUri}, newScore)
      }

      const response = {
        json: (jsonToSet) => {
          expect(RecentlyScored.save).toHaveBeenCalledWith(newUri, newScore.score)
          done()
        }
      }

      jest.spyOn(Score, 'save').mockImplementation(() => Promise.resolve(createdScore))

      ScoreController.post(request, response)
    })

    test('should send SNS message to sync score to AEM', done => {
      const newUri = 'http://somewhere.com/1'
      const newScore = {
        score: 1,
        weight: 6
      }
      const request = {
        body: Object.assign({uri: newUri}, newScore)
      }

      const payload = {
        uri: newUri,
        score: newScore.score
      }
      const params = {
        Message: JSON.stringify(payload),
        TopicArn: process.env.AEM_SNS_TOPIC_ARN
      }

      const response = {
        json: (jsonToSet) => {
          expect(AWS.SNS.prototype.publish).toHaveBeenCalledWith(params, expect.any(Function))
          done()
        }
      }

      jest.spyOn(Score, 'save').mockImplementation(() => Promise.resolve(createdScore))

      ScoreController.post(request, response)
    })
  })
})
