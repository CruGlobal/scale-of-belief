'use strict'

const {
  IdentityStitcher,
  UnknownUserError
} = require('./identity-stitcher')
const {factory, User, Event} = require('../test/factories')

describe('IdentityStitcher', () => {
  test('is defined', () => {
    expect(IdentityStitcher).toBeDefined()
  })

  describe('event without user identities', () => {
    test('should throw UnknownUserError', () => {
      return expect(IdentityStitcher(new Event())).rejects.toThrowError(UnknownUserError)
    })
  })

  describe('event with user', () => {
    let user
    beforeEach(() => {
      return factory.build('authenticated_web_user').then(webUser => { user = webUser })
    })

    describe('has no matches', () => {
      test('should save and resolve the user', () => {
        jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

        return IdentityStitcher(new Event()).then(identity => {
          expect(identity).toBeInstanceOf(User)
          expect(identity.id).toBeDefined()
          expect(identity).toBe(user)
        })
      })
    })

    describe('has one match', () => {
      describe('with only mcid', () => {
        let other
        beforeEach(() => {
          return factory.create('web_user', {mcid: user.mcid}).then(webUser => { other = webUser })
        })

        test('should merge and resolve the matched user', () => {
          jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

          return IdentityStitcher(new Event()).then(identity => {
            expect(identity).toBeInstanceOf(User)
            expect(identity.id).toEqual(other.id)
            expect(identity.network_userid).toEqual(expect.arrayContaining(user.network_userid))
            expect(identity.user_fingerprint).toEqual(expect.arrayContaining(user.user_fingerprint))
          })
        })
      })

      describe('with same primary id (gr_master_person_id)', () => {

      })
    })
  })
})
