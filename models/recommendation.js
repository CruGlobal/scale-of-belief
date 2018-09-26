'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
const Recommendation = sequelize().define('Recommendation', {
  id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.CHAR(32)
  },
  url: {
    get () {
      return this.getDataValue('url').toLowerCase()
    },
    set (val) {
      if (val) {
        this.setDataValue('url', val.toLowerCase())
      } else {
        this.setDataValue('url', val)
      }
    },
    type: DataTypes.STRING(2048),
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 10
    }
  },
  title: DataTypes.TEXT,
  message: DataTypes.TEXT,
  thumbnail_url: DataTypes.STRING(2048),
  language: DataTypes.STRING(8),
  categories: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'recommendations',
  underscored: true,
  timestamps: false
})

module.exports = Recommendation
