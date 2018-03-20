'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
const Score = sequelize.define('Score', {
  uri: {
    type: DataTypes.STRING,
    get () {
      return this.getDataValue('uri').toLowerCase()
    },
    set (val) {
      if (val) {
        this.setDataValue('uri', val.toLowerCase())
      } else {
        this.setDataValue('uri', val)
      }
    }
  },
  unaware: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  curious: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  follower: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  guide: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  confidence: {
    type: DataTypes.DOUBLE,
    validate: {
      min: 0,
      max: 1,
      isFloat: true
    }
  }
}, {
  tableName: 'scores'
})

module.exports = Score
