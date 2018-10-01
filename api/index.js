'use strict'

const path = require('path')
const serverless = require('serverless-http')
const express = require('express')
const swaggerizeExpress = require('swaggerize-express')
const api = express()
const rollbar = require('../config/rollbar')
const bodyParser = require('body-parser')
const jsonErrorHandler = require(path.join(__dirname, 'errors/jsonHandler'))
const jwt = require('express-jwt')

api.use(jwt({ secret: process.env.JWT_SECRET }).unless((request) => {
  if (request.headers['x-api-key'] || request.path.endsWith('/login') || request.query['apiKey']) {
    return true
  }
}))

api.use(function (request, response, next) {
  response.header('Access-Control-Allow-Origin', '*')
  response.header('Access-Control-Allow-Headers', 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,Origin,X-Requested-With,Accept')
  response.header('Access-Control-Max-Age', '86400')
  next()
})

api.use(bodyParser.json())
api.use(swaggerizeExpress({
  api: path.join(__dirname, 'scale-of-belief.yml'),
  docspath: '/api-docs',
  handlers: path.join(__dirname, 'controllers')
}))
api.use(jsonErrorHandler)
api.set('view engine', 'pug')
api.set('views', path.join(__dirname, 'views'))

module.exports.handler = rollbar.lambdaHandler(serverless(api))
