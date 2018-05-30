'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
require('../config/papertrail')
const Score = sequelize().define('Score', {
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
      max: 6
    }
  },
  curious: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 6
    }
  },
  follower: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 6
    }
  },
  guide: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 6
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
  underscored: true,
  getterMethods: {
    primaryKey () {
      return this.uri
    }
  }
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

Score.save = (uri, score) => {
  return sequelize().transaction(function (t) {
    return Score.upsert(
      {
        uri: uri,
        unaware: score.unaware,
        curious: score.curious,
        follower: score.follower,
        guide: score.guide,
        confidence: score.confidence
      },
      {
        transaction: t,
        returning: true
      }
    )
  })
}

Score.Revisions = Score.hasPaperTrail()

module.exports = Score
