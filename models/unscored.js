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

//get all scores from database
//jonah, oct 24, 2019
Unscored.getAllUris = () => {
  const unscoredArray = []
  // find multiple entries
  return Unscored.findAll({
    attributes: ['uri']
  }).then(unscored => {
    unscored.forEach(element => {
      unscoredArray.push(Unscored.toScoreObject(element))
    })
    return Array.from(unscoredArray)
  })
}

//return new object with chosen attributes
//jonah, october 24
Unscored.toScoreObject = (element) => {
  return{
    uri: element.uri,
    weight: 0,
    score: -1
  }
}

module.exports = Unscored
