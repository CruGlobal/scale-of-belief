'use strict'

module.exports = (sequelize, DataTypes) => {
  const Score = sequelize.define('Score', {
    uri: {
      type: DataTypes.STRING,
      get () {
        return this.getDataValue('uri').toLowerCase()
      },
      set (val) {
        this.setDataValue('uri', val.toLowerCase())
      }
    },
    unaware: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 4
      }
    },
    curious: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 4
      }
    },
    follower: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 4
      }
    },
    guide: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 4
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

  return Score
}
