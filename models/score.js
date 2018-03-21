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
    },
    primaryKey: true
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
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'scores',
  underscored: true
})

Score.toApiScore = (score) => {
  return {
    uri: score.uri,
    score: {
      unaware: score.unaware,
      curious: score.curious,
      follower: score.follower,
      guide: score.guide,
      confidence: score.confidence
    }
  }
}

Score.retrieve = (uri) => {
  return Score.findOne({
    where: {
      uri: uri
    }
  })
}

module.exports = Score
