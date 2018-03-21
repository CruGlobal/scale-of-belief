'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
const ApiKey = sequelize.define('ApiKey', {
  system: DataTypes.STRING,
  api_pattern: DataTypes.ARRAY(DataTypes.STRING),
  api_key: DataTypes.UUID,
  contact_email: DataTypes.STRING
}, {
  tableName: 'api_keys'
})

module.exports = ApiKey
