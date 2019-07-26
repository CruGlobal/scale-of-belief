'use strict'

const ContentController = require('../../api/controllers/content.js')
const factory = require('../factory')
const Unscored = require('../../models/unscored')

describe('ContentController', () => {
  let unscored1, unscored2
  beforeEach(() => {
    return Promise.all([
      factory.build('unscored'),
      factory.build('unscored', {
        uri: 'http://some.other.uri.com'
      }),
      factory.build('unscored', {
        uri: 'http://some.uri.com/1'
      }),
      factory.build('unscored', {
        uri: 'http://some.other.uri.com/1'
      })
    ]).then(data => {
      unscored1 = data[0]
      unscored2 = data[1]
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
            data: [unscored1.uri],
            meta: {
              total: 1
            }
          })
          done()
        }
      }

      jest.spyOn(Unscored, 'findAndCountAll')
        .mockImplementationOnce(() => Promise.resolve({rows: [unscored1], count: 1}))

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
            data: [unscored1.uri, unscored2.uri],
            meta: {
              total: 2
            }
          })
          done()
        }
      }

      jest.spyOn(Unscored, 'findAndCountAll')
        .mockImplementationOnce(() => Promise.resolve({rows: [unscored1, unscored2], count: 2}))

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

      jest.spyOn(Unscored, 'findAndCountAll').mockImplementationOnce(() => Promise.resolve({rows: [], count: 0}))

      ContentController.get(request, response)
    })
  })

  describe('has more than one page of matches', () => {
    it('should return limited rows with a full count total', done => {
      const request = {
        query: {
          uri: 'http',
          page: '1',
          per_page: '1',
          order: 'ASC'
        }
      }

      const response = {
        json: (jsonToSet) => {
          expect(jsonToSet).toBeDefined()
          expect(jsonToSet.data).toEqual([unscored1.uri])
          expect(jsonToSet.meta.total).toEqual(2)
          done()
        }
      }

      jest.spyOn(Unscored, 'findAndCountAll')
        .mockImplementationOnce(() => Promise.resolve({rows: [unscored1], count: 2}))

      ContentController.get(request, response)
    })
  })
})
