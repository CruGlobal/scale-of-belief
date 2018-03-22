'use strict'

const sequelize = require('../config/sequelize')
const User = require('./user')
const Event = require('./event')
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

/**
 * Find all Users that match at least one identity of a given user
 * @param {User} user
 * @returns {Promise} Promise representing array of possible matched users
 */
const possibleMatches = (user, transaction) => {
  const orClause = []
  // Generate OR query skipping id and id_seq columns as well as empty values
  forIn(user.toJSON(), (value, key) => {
    if (includes(['id', 'id_seq'], key) || isEmpty(value)) {
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
 * @param {User} user
 * @param {User[]} matches
 * @returns {Promise} Promise representing final saved user
 */
const mergeMatches = (user, matches, transaction) => {
  if (isEmpty(matches)) {
    // No matches found, save new user
    return user.save()
  } else {
    // Add new user to matches
    matches = matches.concat(user)

    // Matches are ordered by score, so let first be the winner
    const winner = matches.shift()
    const queries = []
    const loserIds = []

    // Merge losers with winner and destroy them
    forEach(matches, loser => {
      winner.merge(loser)
      if (!loser.isNewRecord) {
        loserIds.push(loser.id)
        queries.push(loser.destroy({transaction: transaction}))
      }
    })

    return Promise
      .all(queries) // wait for deletes
      .then(() => winner.save({transaction: transaction})) // save user
      .then(identity => {
        return Event // update Events linked to merged matches
          .update({user_id: identity.id}, {where: {user_id: {[Op.in]: loserIds}}, transaction: transaction})
          .then(() => Promise.resolve(identity)) // return final user
      })
  }
}

/**
 * Performs identity stitching for the given event
 * @param {Event} event
 * @returns {Promise<any>}
 */
const performIdentityStitching = (event) => {
  return new Promise((resolve) => {
    let user = User.fromEvent(event)
    if (!user.changed()) {
      throw new UnknownUserError('Event did not contain identity fields')
    }

    resolve(sequelize.transaction(transaction => {
      return possibleMatches(user, transaction)
        .then(matches => orderByScore(user, matches))
        .then(matches => rejectMatches(user, matches))
        .then(matches => rejectAmbiguous(user, matches))
        .then(matches => mergeMatches(user, matches, transaction))
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
        return pair[1].length * 4
      case 'sso_guid':
        return pair[1].length * 3
      case 'domain_userid':
      case 'android_idfa':
      case 'apple_idfa':
        return pair[1].length * 2
      case 'mcid':
      case 'user_fingerprint':
      case 'network_userid':
        return pair[1].length * 1
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
  if (matches['gr_master_person_id'].length > 0 || matches['sso_guid'].length > 0) {
    return true
  }

  // If gr_master_person_id exists on both, and are different, it's not the same
  if (user.has_gr_master_person_id && other.has_gr_master_person_id && matches['gr_master_person_id'].length === 0) {
    return false
  }

  // If sso_guid exists on both, and is different, it's not the same
  if (user.has_sso_guid && other.has_sso_guid && matches['sso_guid'].length === 0) {
    return false
  }

  return true
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

class UnknownUserError extends Error {}

module.exports = {
  IdentityStitcher: performIdentityStitching,
  UnknownUserError: UnknownUserError
}
