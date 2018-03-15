'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
const ApiKey = sequelize.define('ApiKey', {
  system: DataTypes.STRING,
  api_pattern: DataTypes.ARRAY(DataTypes.STRING),
  api_key: {
    type: DataTypes.UUID,
    primaryKey: true,
    field: 'api_key'
  },
  contact_email: DataTypes.STRING
}, {
  tableName: 'api_keys',
  underscored: true
})

module.exports = ApiKey
