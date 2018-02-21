'use strict'

const path = require('path')
const glob = require('glob')
const Sequelize = require('sequelize')
const environment = process.env.NODE_ENV === 'test' ? 'test' : 'development'
const config = require(path.resolve('config', 'database.js'))[environment]
const db = {}
const sequelize = new Sequelize(config.database, config.username, config.password, config)

// Import all *.model.js files and wrap them in sequelize
glob.sync('./*.model.js', {cwd: __dirname})
  .forEach(file => {
    let model = sequelize['import'](path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
