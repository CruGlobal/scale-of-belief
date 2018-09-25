'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
const RecentlyScored = sequelize().define('RecentlyScored', {
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
  }
}, {
  tableName: 'recently_scored',
  underscored: true,
  timestamps: false,
  getterMethods: {
    primaryKey () {
      return this.uri
    }
  }
})

RecentlyScored.retrieve = (uri) => {
  return RecentlyScored.findOne({
    where: {
      uri: uri
    }
  })
}

RecentlyScored.save = (uri, score) => {
  return sequelize().transaction(function (t) {
    const upsertData = {
      uri: uri,
      score: score
    }

    return RecentlyScored.findById(uri).then((result) => {
      if (result) {
        return result.update(
          upsertData,
          {
            transaction: t,
            returning: true
          })
      } else {
        return RecentlyScored.create(
          upsertData,
          {
            transaction: t,
            returning: true
          })
      }
    })
  })
}

module.exports = RecentlyScored
