'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
const ApiUser = sequelize().define('ApiUser', {
  guid: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  api_pattern: DataTypes.ARRAY(DataTypes.STRING),
  contact_email: DataTypes.STRING,
  type: DataTypes.STRING
}, {
  tableName: 'api_users',
  underscored: true
})

ApiUser.retrieve = (guid) => {
  return ApiUser.findOne({
    where: {
      guid: guid
    }
  })
}

ApiUser.save = (user) => {
  return sequelize().transaction((t) => {
    return ApiUser.upsert(
      {
        guid: user.guid,
        api_pattern: user.api_pattern,
        contact_email: user.contact_email,
        type: user.type
      },
      {
        transaction: t,
        returning: true
      }
    )
  })
}

module.exports = ApiUser
