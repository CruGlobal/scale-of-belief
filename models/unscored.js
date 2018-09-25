'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')

const Unscored = sequelize().define('Unscored', {
  uri: {
    type: DataTypes.STRING(2048),
    get () {
      return this.getDataValue('uri').toLowerCase()
    },
    primaryKey: true
  },
  last_refreshed: DataTypes.DATE
}, {
  tableName: 'unscored',
  timestamps: false
})

module.exports = Unscored
