'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
const ApiUser = sequelize().define('ApiUser', {
  guid: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  api_pattern: DataTypes.ARRAY(DataTypes.STRING),
  contact_email: DataTypes.STRING
}, {
  tableName: 'api_users',
  underscored: true
})

module.exports = ApiUser
