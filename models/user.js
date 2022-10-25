'use strict'

const {
  clone,
  compact,
  forEach,
  includes,
  map,
  toLower,
  uniq,
  without
} = require('lodash')
const Context = require('./context')
const { DataTypes } = require('sequelize')
const sequelize = require('../config/sequelize')
const browserFields = ['domain_userid', 'network_userid', 'user_fingerprint']
const idFields = ['sso_guid', 'gr_master_person_id', 'mcid']
const idfaFields = ['device_idfa']
const uuidFields = ['network_userid', 'sso_guid', 'gr_master_person_id']
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const User = sequelize().define('User', {
  domain_userid: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  network_userid: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    set: function (value) { this.setDataValue('network_userid', map(value, toLower)) }
  },
  user_fingerprint: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  sso_guid: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    set: function (value) { this.setDataValue('sso_guid', map(value, toLower)) }
  },
  gr_master_person_id: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    set: function (value) { this.setDataValue('gr_master_person_id', map(value, toLower)) }
  },
  mcid: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  device_idfa: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: false
})

User.IDENTITY_FIELDS = [].concat(idFields, browserFields, idfaFields)

forEach(User.IDENTITY_FIELDS, (field) => {
  User.prototype.__defineGetter__(`has_${field}`, function () {
    return (this[field]).length > 0
  })
})

const fieldValue = (value, field) => {
  if (includes(uuidFields, field)) {
    return uuidPattern.test(value) ? [value] : /* istanbul ignore next */ []
  }
  return [value]
}

User.fromEvent = (event) => {
  const user = new User()

  const context = event.contexts
  if (context instanceof Context) {
    if (context.hasSchema(Context.SCHEMA_MOBILE)) {
      const data = context.dataFor(Context.SCHEMA_MOBILE)
      // https://github.com/snowplow/iglu-central/blob/master/schemas/com.snowplowanalytics.snowplow/mobile_context/jsonschema/1-0-1
      user.device_idfa = compact(map(['androidIdfa', 'appleIdfa', 'appleIdfv', 'openIdfa'], field => {
        return data[field]
      }))
    }

    if (context.hasSchema(Context.SCHEMA_IDS)) {
      const data = context.dataFor(Context.SCHEMA_IDS)
      forEach(idFields, field => {
        if (typeof data[field] !== 'undefined' && data[field]) {
          user[field] = fieldValue(data[field], field)
        }
      })
    }
  }

  // Skip network_userid field on mobile and server platforms.
  // They seem to set these to random uuid's on each request.
  const fields = includes(['mob', 'srv'], event.platform) ? without(browserFields, 'network_userid') : browserFields
  forEach(fields, field => {
    if (typeof event[field] !== 'undefined' && event[field]) {
      user[field] = fieldValue(event[field], field)
    }
  })

  return user
}

/**
 * Merges all identity fields and removes duplicates
 * @param {User} other
 * @returns {User} self
 */
User.prototype.merge = function (other) {
  forEach(User.IDENTITY_FIELDS, (field) => {
    this[field] = uniq((this[field]).concat(other[field]))
  })
  return this
}

/**
 * Returns new User with same properties
 * @returns {User}
 */
User.prototype.clone = function () {
  return new User(clone(this.dataValues))
}

module.exports = User
