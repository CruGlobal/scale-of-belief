'use strict'

const {
  clone,
  compact,
  forEach,
  includes,
  map,
  toLower,
  uniq
} = require('lodash')
const Context = require('./context')
const {DataTypes} = require('sequelize')
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
    return uuidPattern.test(value) ? [value] : []
  }
  return [value]
}

User.fromEvent = (event) => {
  const user = new User()
  let isMobile = false

  const context = event.contexts
  if (context instanceof Context) {
    if (context.hasSchema(Context.SCHEMA_MOBILE)) {
      isMobile = true
      const data = context.dataFor(Context.SCHEMA_MOBILE)
      // Todo: iOS not sending events yet, this is a guess at the property name
      user.device_idfa = compact(map(['androidIdfa', 'appleIdfa'], field => {
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

  if (!isMobile) {
    // Only set cookie/browser based fields when not a mobile event
    // Android seemed to set these to random uuid's on each request.
    forEach(browserFields, field => {
      if (typeof event[field] !== 'undefined' && event[field]) {
        user[field] = fieldValue(event[field], field)
      }
    })
  }

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
