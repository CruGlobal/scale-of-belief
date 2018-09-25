'use strict'

const RecentlyScored = require('./recently-scored')
const factory = require('../test/factory')

describe('RecentlyScored', () => {
  it('should be defined', () => {
    expect(RecentlyScored).toBeDefined()
  })

  describe('RecentlyScored.retrieve()', () => {
    it('should return a recently scored event', done => {
      factory.build('existing_recent_score').then(existingScore => {
        expect(existingScore).toBeDefined()

        jest.spyOn(RecentlyScored, 'findOne').mockImplementationOnce(() => {
          return Promise.resolve(existingScore)
        })

        RecentlyScored.retrieve(existingScore.uri).then((result) => {
          expect(result).toBeDefined()
          expect(result).not.toBeNull()
          expect(result.dataValues).toEqual(existingScore.dataValues)
          done()
        }).catch((err) => {
          done.fail(err)
        })
      }).catch((err) => {
        done.fail(err)
      })
    })

    it('should not return a recently scored event', done => {
      RecentlyScored.retrieve('http://random.uri.com').then((result) => {
        expect(result).toBeNull()
        done()
      })
    })

    afterAll(() => {
      return RecentlyScored.destroy({truncate: true})
    })
  })

  describe('RecentlyScored.save()', () => {
    it('should create a new recently scored event', done => {
      factory.build('created_recent_score').then((createdScore) => {
        jest.spyOn(RecentlyScored, 'create').mockImplementationOnce(() => {
          return createdScore
        })

        RecentlyScored.save(createdScore.uri, createdScore.score).then((result) => {
          expect(result).toBeDefined()
          expect(result.dataValues.uri).toEqual(createdScore.dataValues.uri)
          expect(result.dataValues.score).toEqual(createdScore.dataValues.score)
          RecentlyScored.destroy({truncate: true}).then(() => { done() })
        })
      })
    })

    it('should update an existing recently scored event', done => {
      factory.create('existing_recent_score').then((existingScore) => {
        factory.build('updated_recent_score').then((updatedScore) => {
          expect(existingScore).toBeDefined()

          RecentlyScored.save(existingScore.uri, updatedScore.score).then((result) => {
            expect(result).toBeDefined()
            expect(result.dataValues.uri).toEqual(existingScore.dataValues.uri)

            expect(result.dataValues.score).toEqual(updatedScore.dataValues.score)
            expect(result.dataValues.score).not.toEqual(existingScore.dataValues.score)
            factory.cleanUp().then(() => {
              RecentlyScored.destroy({truncate: true}).then(() => {
                done()
              })
            })
          })
        })
      })
    })

    it('should fail if saving with a null URI', done => {
      // The spyOn calls above are affecting this function, which we don't want
      jest.resetModules()
      const unmockedRecentlyScored = require('./recently-scored')
      unmockedRecentlyScored.save(null, 2).then((result) => {
        done.fail(new Error('Save should have had an error, instead had result:', result))
      }).catch((error) => {
        expect(error).toBeDefined()
        done()
      })
    })

    afterEach(() => {
      return RecentlyScored.destroy({truncate: true})
    })
  })

  describe('RecentlyScored.getPrimaryKey()', () => {
    let score
    beforeEach(() => {
      return factory.build('existing_recent_score').then(existingScore => { score = existingScore })
    })

    it('should return the uri', () => {
      const primaryKey = score.get('primaryKey')
      expect(primaryKey).toEqual(score.uri)
    })
  })
})
