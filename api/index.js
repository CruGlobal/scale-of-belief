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
  if (request.headers['x-api-key'] || request.path.endsWith('/login')) {
    return true
  }
}))

api.use(function (request, response, next) {
  if (process.env.ENVIRONMENT !== 'production') {
    let incomingOrigin = request.headers['Origin']

    if (incomingOrigin && (
        incomingOrigin.startsWith('http://content-scoring-local.cru.org:') ||
        incomingOrigin === 'https://content-scoring-stage.cru.org')) {
      response.header('Access-Control-Allow-Origin', incomingOrigin)
      response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    }
  }

  next()
})

api.use(bodyParser.json())
api.use(swaggerizeExpress({
  api: path.join(__dirname, 'scale-of-belief.yml'),
  docspath: '/api-docs',
  handlers: path.join(__dirname, 'controllers')
}))
api.use(jsonErrorHandler)

module.exports.handler = rollbar.lambdaHandler(serverless(api))
