'use strict'

const path = require('path')
const serverless = require('serverless-http')
const express = require('express')
const swaggerizeExpress = require('swaggerize-express')
const api = express()
const rollbar = require('../config/rollbar')
const bodyParser = require('body-parser')
const unauthorizedErrorHandler = require(path.join(__dirname, 'errors/unauthorized'))

api.use(bodyParser.json())
api.use(swaggerizeExpress({
  api: path.join(__dirname, 'scale-of-belief.yml'),
  docspath: '/api-docs',
  handlers: path.join(__dirname, 'controllers')
}))
api.use(unauthorizedErrorHandler)

module.exports.handler = rollbar.lambdaHandler(serverless(api))
