'use strict'

const {
  clone,
  forEach,
  map,
  toLower,
  uniq
} = require('lodash')
const Context = require('./context')
const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
const eventFields = ['domain_userid', 'network_userid', 'user_fingerprint']
const idFields = ['sso_guid', 'gr_master_person_id', 'mcid']
const appFields = ['android_idfa', 'apple_idfa']

const User = sequelize.define('User', {
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
  android_idfa: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  apple_idfa: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: false
})

User.IDENTITY_FIELDS = [].concat(idFields, eventFields, appFields)

forEach(User.IDENTITY_FIELDS, (field) => {
  User.prototype.__defineGetter__(`has_${field}`, function () {
    return (this[field]).length > 0
  })
})

User.fromEvent = (event) => {
  const user = new User()

  forEach(eventFields, field => {
    if (typeof event[field] !== 'undefined') {
      user[field] = [event[field]]
    }
  })

  const context = event.contexts
  if (context instanceof Context) {
    if (context.hasSchema(Context.SCHEMA_MOBILE)) {
      const data = context.dataFor(Context.SCHEMA_MOBILE)
      if (typeof data['androidIdfa'] !== 'undefined') { user.android_idfa = [data['androidIdfa']] }
      // Todo: iOS not sending events yet, this is a guess at the property name
      if (typeof data['appleIdfa'] !== 'undefined') { user.apple_idfa = [data['appleIdfa']] }
    }

    if (context.hasSchema(Context.SCHEMA_IDS)) {
      const data = context.dataFor(Context.SCHEMA_IDS)
      forEach(idFields, field => {
        if (typeof data[field] !== 'undefined') {
          user[field] = [data[field]]
        }
      })
    }
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
