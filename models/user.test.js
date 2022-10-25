'use strict'

const User = require('./user')
const factory = require('../test/factory')

describe('User', () => {
  it('should be defined', () => {
    expect(User).toBeDefined()
  })

  describe('User.fromEvent()', () => {
    let event
    describe('android device event', () => {
      beforeEach(() => {
        return factory.build('android_event').then(androidEvent => { event = androidEvent })
      })

      it('should set user fields based on android event', () => {
        const user = User.fromEvent(event)
        expect(user.domain_userid).toEqual([])
        expect(user.network_userid).toEqual([])
        expect(user.user_fingerprint).toEqual([])
        expect(user.device_idfa).toEqual(['GnfzTXaSGltsr454irrZ'])
        expect(user.mcid).toEqual([])
        expect(user.sso_guid).toEqual([])
        expect(user.gr_master_person_id).toEqual([])
      })
    })

    describe('apple device event', () => {
      beforeEach(() => {
        return factory.build('authenticated_apple_event').then(appleEvent => { event = appleEvent })
      })

      it('should set user fields based on apple event', () => {
        const user = User.fromEvent(event)
        expect(user.domain_userid).toEqual([])
        expect(user.network_userid).toEqual([])
        expect(user.user_fingerprint).toEqual([])
        expect(user.device_idfa).toEqual(['9fLpCpwhvGLKMUJqrPMW'])
        expect(user.mcid).toEqual(['1234567890'])
        expect(user.sso_guid).toEqual(['16c3ce20-396d-4702-8c3f-e5dd0b8ad69e'])
        expect(user.gr_master_person_id).toEqual(['a3b99eb7-f7bf-4443-9c93-09367ab4024b'])
      })
    })

    describe('web event', () => {
      beforeEach(() => {
        return factory.build('web_event').then(webEvent => { event = webEvent })
      })

      it('should set user fields based on web event', () => {
        const user = User.fromEvent(event)
        expect(user.domain_userid).toEqual([event.domain_userid])
        expect(user.network_userid).toEqual([event.network_userid.toLowerCase()])
        expect(user.user_fingerprint).toEqual([event.user_fingerprint])
        expect(user.device_idfa).toEqual([])
        expect(user.mcid).toEqual(['1234567890'])
        expect(user.sso_guid).toEqual([])
        expect(user.gr_master_person_id).toEqual([])
      })
    })
  })

  describe('prototype.merge()', () => {
    let user, other
    beforeEach(() => {
      return Promise.all([
        factory.build('user', {
          domain_userid: ['domain1'],
          network_userid: ['270ecd56-9182-40f5-a87c-f4400f43cbea'],
          mcid: ['mcid1'],
          gr_master_person_id: ['d0bfe465-86a3-49a6-9341-c0cbfdf305f4'],
          sso_guid: ['0d0d8a0b-33f4-462b-89fe-838fce187feb']
        }),
        factory.build('user', {
          domain_userid: ['domain2'],
          mcid: ['mcid1'],
          gr_master_person_id: ['d0bfe465-86a3-49a6-9341-c0cbfdf305f4'],
          sso_guid: ['c4f2282f-1c4e-4fdb-ac29-dde5c1c0e913'],
          device_idfa: ['android1']
        })
      ]).then(users => {
        user = users[0]
        other = users[1]
      })
    })

    it('should merge all identity fields, removing duplicates', () => {
      expect(user.merge(other)).toBe(user)
      expect(user.dataValues).toEqual({
        user_fingerprint: [],
        device_idfa: ['android1'],
        id: null,
        domain_userid: ['domain1', 'domain2'],
        network_userid: ['270ecd56-9182-40f5-a87c-f4400f43cbea'],
        mcid: ['mcid1'],
        gr_master_person_id: ['d0bfe465-86a3-49a6-9341-c0cbfdf305f4'],
        sso_guid: ['0d0d8a0b-33f4-462b-89fe-838fce187feb', 'c4f2282f-1c4e-4fdb-ac29-dde5c1c0e913']
      })
    })
  })

  describe('prototype.clone()', () => {
    let user
    beforeEach(() => {
      return factory.build('authenticated_web_user').then(webUser => { user = webUser })
    })

    it('should clone the user', () => {
      const clone = user.clone()
      expect(clone).toBeInstanceOf(User)
      expect(clone.dataValues).toEqual(user.dataValues)
      expect(clone).not.toBe(user)
    })
  })
})
