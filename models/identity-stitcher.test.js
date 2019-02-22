'use strict'

const {
  IdentityStitcher,
  UnknownUserError,
  KnownTestUserError,
  _isSameSame,
  _rejectAmbiguous
} = require('./identity-stitcher')
const factory = require('../test/factory')
const chance = require('chance').Chance()
const User = require('./user')
const Event = require('./event')
const UserAudit = require('./user-audit')
const {sortBy, uniq, map} = require('lodash')

describe('IdentityStitcher', () => {
  let user
  let auditSpy = jest.spyOn(UserAudit, 'bulkCreate').mockImplementation(() => Promise.resolve())
  beforeEach(() => {
    auditSpy.mockClear()
    return factory.build('authenticated_web_user').then(webUser => { user = webUser })
  })

  it('is defined', () => {
    expect(IdentityStitcher).toBeDefined()
  })

  it('event without user identities should throw UnknownUserError', () => {
    return expect(IdentityStitcher(new Event())).rejects.toThrowError(UnknownUserError)
  })

  it('event with known test user identities (sso_guid) should throw KnownTestUserError', () => {
    user.sso_guid = ['49e1f2f9-55cc-6c10-58ff-b9b46ca79579']
    jest.spyOn(User, 'fromEvent').mockImplementation(() => user)
    return expect(IdentityStitcher(new Event())).rejects.toThrowError(KnownTestUserError)
  })

  it('event with known test user identities (gr_master_person_id) should throw KnownTestUserError', () => {
    user.gr_master_person_id = ['f19c4ec2-057d-4b7b-958b-e88452881a28']
    jest.spyOn(User, 'fromEvent').mockImplementation(() => user)
    return expect(IdentityStitcher(new Event())).rejects.toThrowError(KnownTestUserError)
  })

  describe('has no matches', () => {
    it('should save the user', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        expect(identity).toBeInstanceOf(User)
        expect(identity.id).toBeDefined()
        expect(event.user_id).toEqual(identity.id)
        expect(identity).toBe(user)
      })
    })
  })

  describe('has one match', () => {
    let other
    beforeEach(() => {
      return factory.create('web_user', {mcid: user.mcid, domain_userid: user.domain_userid})
        .then(webUser => { other = webUser })
    })

    it('should merge user', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        expect(identity).toBeInstanceOf(User)
        expect(identity.id).toEqual(other.id)
        expect(event.user_id).toEqual(identity.id)
        expect(identity.network_userid).toEqual(expect.arrayContaining(user.network_userid))
        expect(identity.user_fingerprint).toEqual(expect.arrayContaining(user.user_fingerprint))
      })
    })
  })

  describe('has one false positive match', () => {
    let other
    beforeEach(() => {
      return factory.create('authenticated_web_user', {mcid: user.mcid}).then(webUser => { other = webUser })
    })

    it('should create new user and not merge', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        expect(identity).toBeInstanceOf(User)
        expect(identity.id).not.toEqual(other.id)
        expect(event.user_id).toEqual(identity.id)
        expect(identity.gr_master_person_id).not.toEqual(expect.arrayContaining(other.gr_master_person_id))
      })
    })
  })

  describe('has multiple matches', () => {
    let others
    beforeEach(() => {
      return Promise.all([
        factory.create('web_user', {gr_master_person_id: user.gr_master_person_id}),
        factory.create('web_user', {mcid: user.mcid}),
        factory.create('web_user', {sso_guid: user.sso_guid})
      ]).then((users) => { others = users })
    })

    it('should merge users and return best match', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        const mcids = uniq([].concat(user.mcid, others[0].mcid, others[1].mcid, others[2].mcid))
        const grids = uniq([].concat(user.gr_master_person_id, others[0].gr_master_person_id,
          others[1].gr_master_person_id, others[2].gr_master_person_id))
        expect(identity).toBeInstanceOf(User)
        expect(identity.id).toEqual(others[0].id)
        expect(auditSpy).toHaveBeenCalledWith([{id: identity.id, old_id: others[2].id},
          {id: identity.id, old_id: others[1].id}], expect.anything())
        expect(event.user_id).toEqual(identity.id)
        expect(sortBy(identity.mcid)).toEqual(sortBy(mcids))
        expect(identity.gr_master_person_id).toEqual(expect.arrayContaining(grids))
      })
    })
  })

  describe('has multiple matches with false positives', () => {
    let others
    beforeEach(() => {
      return Promise.all([
        factory.create('web_user', {gr_master_person_id: user.gr_master_person_id}),
        factory.create('authenticated_web_user', {mcid: user.mcid, domain_userid: user.domain_userid}), // false positive
        factory.create('web_user', {sso_guid: user.sso_guid}),
        factory.create('web_user', {mcid: user.mcid, sso_guid: [chance.guid()]}) // false positive
      ]).then((users) => { others = users })
    })

    it('should merge users and return best match', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        const mcids = uniq([].concat(user.mcid, others[0].mcid, others[2].mcid))
        expect(identity).toBeInstanceOf(User)
        expect(identity.id).toEqual(others[0].id)
        expect(auditSpy).toHaveBeenCalledWith([{id: identity.id, old_id: others[2].id}], expect.anything())
        expect(event.user_id).toEqual(identity.id)
        expect(sortBy(identity.mcid)).toEqual(sortBy(mcids))
        expect(identity.gr_master_person_id).not.toEqual(expect.arrayContaining(others[1].gr_master_person_id))
      })
    })
  })

  describe('has multiple matches that are ambiguous', () => {
    let others
    beforeEach(() => {
      return Promise.all([
        factory.create('authenticated_web_user', {domain_userid: ['1234567890']}),
        factory.create('authenticated_web_user', {domain_userid: ['1234567890']})
      ]).then((users) => { others = users })
    })
    beforeEach(() => {
      return factory.build('web_user', {domain_userid: ['1234567890']}).then(webUser => { user = webUser })
    })

    it('should reject ambiguous and not merge', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        const ids = map(others, 'id')
        expect(identity).toBe(user)
        expect(identity.id).toBeDefined()
        expect(auditSpy).toHaveBeenCalledTimes(0)
        expect(event.user_id).toEqual(identity.id)
        expect(identity).toBe(user)
        expect(ids).not.toEqual(expect.arrayContaining([identity.id]))
      })
    })
  })

  describe('_isSameSame(user, other)', () => {
    let other
    beforeEach(() => {
      return factory.create('web_user').then(webUser => { other = webUser })
    })

    describe('other has same \'sso_guid\'', () => {
      it('should be same same', () => {
        other.sso_guid = user.sso_guid
        expect(_isSameSame(user, other)).toBe(true)
      })

      describe('and different \'gr_master_person_id\'', () => {
        it('should be same same', () => {
          other.sso_guid = user.sso_guid
          other.gr_master_person_id = [chance.guid().toLowerCase()]
          expect(_isSameSame(user, other)).toBe(true)
        })
      })
    })

    describe('other has same \'gr_master_person_id\'', () => {
      it('should be same same', () => {
        other.gr_master_person_id = user.gr_master_person_id
        expect(_isSameSame(user, other)).toBe(true)
      })

      describe('and different \'sso_guid\'', () => {
        it('should be same same', () => {
          other.gr_master_person_id = user.gr_master_person_id
          other.sso_guid = [chance.guid().toLowerCase()]
          expect(_isSameSame(user, other)).toBe(true)
        })
      })
    })

    describe('other has different \'sso_guid\'', () => {
      it('should NOT be same same', () => {
        other.sso_guid = [chance.guid().toLowerCase()]
        expect(_isSameSame(user, other)).toBe(false)
      })

      describe('and same \'network_userid\' and \'domain_userid\'', () => {
        it('should NOT be same same', () => {
          other.sso_guid = [chance.guid().toLowerCase()]
          other.domain_userid = user.domain_userid
          other.network_userid = user.network_userid
          expect(_isSameSame(user, other)).toBe(false)
        })
      })
    })

    describe('other has different \'gr_master_person_id\'', () => {
      it('should NOT be same same', () => {
        other.gr_master_person_id = [chance.guid().toLowerCase()]
        expect(_isSameSame(user, other)).toBe(false)
      })

      describe('and same \'network_userid\' and \'domain_userid\'', () => {
        it('should NOT be same same', () => {
          other.sso_guid = [chance.guid().toLowerCase()]
          other.domain_userid = user.domain_userid
          other.network_userid = user.network_userid
          expect(_isSameSame(user, other)).toBe(false)
        })
      })
    })

    describe('other has same \'device_idfa\'', () => {
      it('should be same same', () => {
        other.device_idfa = user.device_idfa = [chance.android_id()]
        expect(_isSameSame(user, other)).toBe(true)
      })
    })

    describe('other has different \'device_idfa\'', () => {
      it('should NOT be same same', () => {
        user.device_idfa = [chance.android_id()]
        other.device_idfa = [chance.apple_token()]
        expect(_isSameSame(user, other)).toBe(false)
      })
    })
  })

  describe('_rejectAmbiguous(user, matches)', () => {
    let matches
    beforeEach(() => {
      return Promise.all([
        factory.create('web_user', {sso_guid: [chance.guid().toLowerCase()]}),
        factory.create('web_user', {mcid: user.mcid, domain_userid: user.domain_userid})
      ]).then(users => { matches = users })
    })

    it('correctly rejects ambiguous matches', () => {
      return _rejectAmbiguous(user, matches).then((result) => {
        expect(result).toHaveLength(1)
      })
    })
  })
})
