'use strict'

const Sequelize = require('sequelize')
const sequelize = require('./sequelize')
const PaperTrail = require('sequelize-paper-trail')

const User = require('../models/user')
const Event = require('../models/event')
const Score = require('../models/score')
const ApiKey = require('../models/api-key')
const ApiUser = require('../models/api-user')

let db = {}

const paperTrail = PaperTrail.init(sequelize(), {
  underscored: true,
  underscoredAttributes: true,
  enableMigration: false,
  userModel: 'ApiUser', // This has to be defined, but is not being used right now
  revisionModel: 'revisions',
//  revisionChangeModel: 'revision_changes',
  debug: process.env['DEBUG'] === '*'
})

db['User'] = User
db['Event'] = Event
db['Score'] = Score
db['ApiKey'] = ApiKey
db['ApiUser'] = ApiUser

paperTrail.defineModels(db)

Object.keys(db).forEach(function (modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize()
db.Sequelize = Sequelize

module.exports = db
