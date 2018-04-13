'use strict'

const ApiUser = require('./api-user')
const factory = require('../test/factory')

describe('ApiUser', () => {
  it('should be defined', () => {
    expect(ApiUser).toBeDefined()
  })

  describe('ApiUser.retrieve()', () => {
    let user
    beforeEach(() => {
      return factory.create('existing_user').then(existingUser => { user = existingUser })
    })

    it('should return an existing user', () => {
      expect.assertions(3)
      expect(user).toBeDefined()
      return ApiUser.retrieve(user.guid).then((result) => {
        expect(result).toBeDefined()
        expect(result.contact_email).toEqual(user.contact_email)
      })
    })

    it('should not return an existing score', () => {
      expect.assertions(1)
      return ApiUser.retrieve('86d88227-a0a0-4a91-b313-fc397765919c').then((result) => {
        expect(result).toBeNull()
      })
    })
  })

  describe('ApiUser.save()', () => {
    let existingUser, createdUser, updatedUser
    beforeEach(() => {
      return Promise.all([
        factory.build('existing_user'),
        factory.build('created_user'),
        factory.create('updated_user')
      ]).then(scores => {
        existingUser = scores[0]
        createdUser = scores[1]
        updatedUser = scores[2]
      })
    })

    it('should create a new user', done => {
      ApiUser.save(createdUser).then((result) => {
        expect(result).toBeDefined()
        expect(result[0].guid).toEqual(createdUser.guid)
        expect(result[0].api_pattern).toEqual(createdUser.api_pattern)
        expect(result[0].contact_email).toEqual(createdUser.contact_email)
        expect(result[0].type).toEqual(createdUser.type)
        done()
      })
    })

    it('should update an existing user', done => {
      ApiUser.save(updatedUser).then((result) => {
        expect(result).toBeDefined()
        expect(result[0].guid).toEqual(existingUser.guid)

        expect(result[0].api_pattern).toEqual(updatedUser.api_pattern)
        expect(result[0].api_pattern).not.toEqual(existingUser.api_pattern)

        expect(result[0].contact_email).toEqual(updatedUser.contact_email)
        expect(result[0].contact_email).not.toEqual(existingUser.contact_email)

        expect(result[0].type).toEqual(updatedUser.type)
        expect(result[0].type).not.toEqual(existingUser.type)
        done()
      })
    })
  })
})
