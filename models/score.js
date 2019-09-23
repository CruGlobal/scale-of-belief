'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
require('../config/papertrail')
const Score = sequelize().define('Score', {
  uri: {
    type: DataTypes.STRING(2048),
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
  score: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 10
    }
  },
  weight: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
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
    score: score.score,
    weight: score.weight
  }
}

Score.toUriScore = (score) => {
  return {
    uri: score.uri,
    score: score.score
  }
}

Score.toUnscored = (uri) => {
  return {
    uri: uri,
    score: -1
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
    const upsertData = {
      uri: uri,
      score: score.score,
      weight: score.weight
    }

    return Score.findById(uri).then((result) => {
      if (result) {
        return result.update(
          upsertData,
          {
            transaction: t,
            returning: true
          })
      } else {
        return Score.create(
          upsertData,
          {
            transaction: t,
            returning: true
          })
      }
    })
  })
}

Score.Revisions = Score.hasPaperTrail()

module.exports = Score
