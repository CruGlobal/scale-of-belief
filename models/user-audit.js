'use strict'

const { DataTypes } = require('sequelize')
const sequelize = require('../config/sequelize')
const UserAudit = sequelize().define('UserAudit', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  old_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  }
}, {
  tableName: 'user_audits',
  underscored: true
})

module.exports = UserAudit
