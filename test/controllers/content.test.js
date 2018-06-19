'use strict'

const ContentController = require('../../api/controllers/content.js')
const factory = require('../factory')
const sequelize = require('../../config/sequelize')

describe('ContentController', () => {
  let event1, event2
  beforeEach(() => {
    return Promise.all([
      factory.build('existing_score'),
      factory.build('blank_score', {
        uri: 'http://some.other.uri.com',
        score: 3,
        weight: 1
      }),
      factory.build('web_event', {
        uri: 'http://some.uri.com'
      }),
      factory.build('web_event', {
        uri: 'http://some.uri.com/1'
      }),
      factory.build('web_event', {
        uri: 'http://some.other.uri.com'
      }),
      factory.build('web_event', {
        uri: 'http://some.other.uri.com/1'
      })
    ]).then(data => {
      event1 = data[3]
      event2 = data[5]
    })
  })

  test('is defined', () => {
    expect(ContentController).toBeDefined()
  })

  describe('has one match', () => {
    test('should return the content without a score to the client', done => {
      var request = {
        query: {
          uri: 'http://some.uri'
        }
      }

      var response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual({
            data: [event1.uri],
            meta: {
              total: 1
            }
          })
          done()
        }
      }

      jest.spyOn(sequelize(), 'query')
        .mockImplementationOnce(() => Promise.resolve([{count: 1}]))
        .mockImplementationOnce(() => Promise.resolve([event1]))

      ContentController.get(request, response)
    })
  })

  describe('has multiple matches', () => {
    test('should return the content without scores to the client', done => {
      var request = {
        query: {
          uri: 'http://some'
        }
      }

      var response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet).toEqual({
            data: [event1.uri, event2.uri],
            meta: {
              total: 2
            }
          })
          done()
        }
      }

      jest.spyOn(sequelize(), 'query')
        .mockImplementationOnce(() => Promise.resolve([{count: 2}]))
        .mockImplementationOnce(() => Promise.resolve([event1, event2]))

      ContentController.get(request, response)
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

      jest.spyOn(sequelize(), 'query')
        .mockImplementationOnce(() => Promise.resolve([{count: 0}]))
        .mockImplementationOnce(() => Promise.resolve([]))

      ContentController.get(request, response)
    })
  })
})
