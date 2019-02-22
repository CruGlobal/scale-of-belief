'use strict'

const sequelize = require('../config/sequelize')
const User = require('./user')
const Event = require('./event')
const UserAudit = require('./user-audit')
const {Op} = require('sequelize')
const {
  filter,
  find,
  forEach,
  forIn,
  includes,
  intersection,
  isEmpty,
  map,
  reverse,
  sortBy,
  sumBy,
  toPairs,
  without,
  zipObject
} = require('lodash')
const TestUserGuids = [
  '49e1f2f9-55cc-6c10-58ff-b9b46ca79579', // test@test.com
  'fd8c0e67-d19e-49c5-94c2-ff737302d2bc', // bill.test@tester.com
  'f51870d2-23d4-4574-94e1-dd12127a7680' // ert.test@cru.org
]
const TestUserGRIds = [
  '6017a717-251c-434f-aa2f-e4279328fa59', // test@test.com
  'f19c4ec2-057d-4b7b-958b-e88452881a28',
  '2c4b60d4-7b21-43f7-836f-4f255330ecd2',
  '8a9f5933-b4e1-4ec2-a072-f5ff34e349e6', // bill.test@tester.com
  'd067ce6b-4f44-4edd-8a0d-8959ee18cc2b' // ert.test@cru.org
]

/**
 * Find all Users that match at least one identity of a given user
 * @param {User} user
 * @returns {Promise} Promise representing array of possible matched users
 */
const possibleMatches = (user, transaction) => {
  const orClause = []
  // Generate OR query skipping id, id_seq and user_fingerprint columns as well as empty values
  forIn(user.toJSON(), (value, key) => {
    if (includes(['id', 'id_seq', 'user_fingerprint'], key) || isEmpty(value)) {
      return
    }
    orClause.push({[key]: {[Op.contains]: value}})
  })
  return User.findAll({
    transaction: transaction,
    lock: transaction.LOCK.UPDATE,
    where: {
      [Op.or]: orClause
    }
  })
}

/**
 * @param {User} user
 * @param {User[]} matches
 * @returns {Promise} Promise representing matches ordered by score
 */
const orderByScore = (user, matches) => {
  return Promise.resolve(reverse(sortBy(matches, value => scoreMatch(user, value))))
}

/**
 * Reject matches that are not the user (false positives)
 *
 * @param {User} user
 * @param {User[]} matches
 * @returns {Promise} Promise representing matches with rejected users removed
 */
const rejectMatches = (user, matches) => {
  return Promise.resolve(filter(matches, (match) => isSameSame(user, match)))
}

/**
 * Reject matches that would result in an ambiguous identity.
 * Example: user matches multiple others only on mcid, but if merged with them, gr_master_person_ids differ.
 * This should create a new user with just mcid
 *
 * @param {User} user
 * @param {User[]} matches
 * @returns {Promise} Promise representing matches with ambiguous users removed
 */
const rejectAmbiguous = (user, matches) => {
  // Skip if we have 0 or 1 match
  if (matches.length <= 1) {
    return Promise.resolve(matches)
  }
  // Test merge with each match and compare with the remaining
  const rejected = []
  forEach(matches, (match) => {
    // Clone user and test merge
    const dolly = user.clone().merge(match)

    // Reject match if test merge not samesame as at least 1 remaining match
    if (find(without(matches, match), test => !isSameSame(dolly, test))) {
      rejected.push(match)
    }
  })
  // Return matches with the rejected removed
  return Promise.resolve(without(matches, ...rejected))
}

/**
 * Merges resulting matches and updates associated merged events
 *
 * @param {User} user
 * @param {User[]} matches
 * @returns {Promise} Promise representing final saved user
 */
const mergeMatches = (user, matches, transaction) => {
  if (isEmpty(matches)) {
    // No matches found, save new user
    return user.save({transaction: transaction})
  } else {
    // Add new user to matches
    matches = matches.concat(user)

    // Matches are ordered by score, so let first be the winner
    const winner = matches.shift()
    const loserIds = []

    // Merge losers with winner
    forEach(matches, loser => {
      winner.merge(loser)
      if (!loser.isNewRecord) {
        loserIds.push(loser.id)
      }
    })

    // Delete losers or start with a resolved promise
    let query
    if (loserIds.length > 0) {
      query = User.destroy({where: {id: {[Op.in]: loserIds}}, transaction: transaction})
        .then(() => UserAudit.bulkCreate(map(loserIds, oldId => { return {id: winner.id, old_id: oldId} }), {transaction: transaction}))
    } else {
      query = Promise.resolve()
    }

    // Wait for query (if needed) before
    return query
      .then(() => winner.save({transaction: transaction})) // save user
      .then(identity => {
        // update Events linked to merged matches (if we merged)
        if (loserIds.length > 0) {
          return Event
            .update({user_id: identity.id}, {where: {user_id: {[Op.in]: loserIds}}, transaction: transaction})
            .then(() => Promise.resolve(identity)) // return final user
        } else {
          return Promise.resolve(identity)
        }
      })
  }
}

/**
 * Performs identity stitching for the given event
 * Adds the user_id to the event but does not save it.
 *
 * @param {Event} event
 * @returns {Promise<any>}
 */
const performIdentityStitching = (event) => {
  return new Promise((resolve) => {
    let user = User.fromEvent(event)
    if (!user.changed()) {
      throw new UnknownUserError('Event did not contain identity fields')
    }

    if (isKnownTestUser(user)) {
      throw new KnownTestUserError('User is a known testing account.')
    }

    resolve(sequelize().transaction(transaction => {
      return possibleMatches(user, transaction)
        .then(matches => orderByScore(user, matches))
        .then(matches => rejectMatches(user, matches))
        .then(matches => rejectAmbiguous(user, matches))
        .then(matches => mergeMatches(user, matches, transaction))
        .then(identity => {
          event.user_id = identity.id
          return identity
        })
    }))
  })
}

/**
 * Calculates score by summing weighted intersections of identity values
 *
 * @param {User} user
 * @param {User} match
 * @returns {integer}
 */
const scoreMatch = (user, match) => {
  return sumBy(toPairs(userIntersection(user, match)), pair => {
    switch (pair[0]) {
      case 'gr_master_person_id':
        return pair[1].length * 5
      case 'sso_guid':
        return pair[1].length * 4
      case 'device_idfa':
        return pair[1].length * 3
      case 'mcid':
      case 'user_fingerprint':
      case 'network_userid':
      case 'domain_userid':
        return pair[1].length * 1
      /* istanbul ignore next */
      default:
        return 0
    }
  })
}

/**
 * Are the two users Same Same? Not identical, but not different.
 * @param {User} user
 * @param {User} other
 * @returns {Boolean}
 */
const isSameSame = (user, other) => {
  const matches = userIntersection(user, other)
  // If gr_master_person_id or sso_guid match, then it's the same user
  if (matches['gr_master_person_id'].length > 0 || matches['sso_guid'].length > 0) return true

  // If gr_master_person_id exists on both, and are different, it's not the same
  if (user.has_gr_master_person_id && other.has_gr_master_person_id && matches['gr_master_person_id'].length === 0) return false

  // If sso_guid exists on both, and is different, it's not the same
  if (user.has_sso_guid && other.has_sso_guid && matches['sso_guid'].length === 0) return false

  // If device_idfa or mcid match, then it's the same user
  if (matches['device_idfa'].length > 0 || matches['mcid'].length > 0) return true

  // If device_idfa exists on both and is different, it's not the same
  if (user.has_device_idfa && other.has_device_idfa && matches['device_idfa'].length === 0) return false

  // If at least 2 fields match, it's the same user
  if (sumBy(toPairs(matches), pair => { return pair[1].length > 0 ? 1 : 0 }) >= 2) return true

  return false
}

/**
 * The intersection of 2 users keyed by identity field
 *
 * @param {User} user
 * @param {User} other
 * @returns {Object}
 */
const userIntersection = (user, other) => {
  return zipObject(User.IDENTITY_FIELDS, map(User.IDENTITY_FIELDS, (field) => intersection(user[field], other[field])))
}

const isKnownTestUser = (user) => {
  return intersection(user.sso_guid || /* istanbul ignore next */ [], TestUserGuids).length > 0 ||
    intersection(user.gr_master_person_id || /* istanbul ignore next */ [], TestUserGRIds).length > 0
}

class UnknownUserError extends Error {}

class KnownTestUserError extends Error {}

module.exports = {
  IdentityStitcher: performIdentityStitching,
  UnknownUserError: UnknownUserError,
  KnownTestUserError: KnownTestUserError,
  /**
   * @private
   */
  _isSameSame: isSameSame,
  /**
   * @private
   */
  _rejectAmbiguous: rejectAmbiguous
}
