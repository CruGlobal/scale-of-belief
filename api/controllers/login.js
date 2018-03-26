'use strict'

const https = require('https')
const jwt = require('jsonwebtoken')
const logger = require('../../config/logger')

const get = (request, response) => {
  request.body = {
    ticket: request.query['ticket']
  }

  post(request, response)
}

const post = (request, response) => {
  var serviceTicket = request.body['ticket']

  if (!serviceTicket) {
    buildUnauthorized(response)
    return
  }

  validateTicket(serviceTicket, (data) => {
    if (!data) {
      buildInternalErrorResponse(response)
      return
    }

    var json = JSON.parse(data)
    if (json.serviceResponse.authenticationFailure) {
      logger.debug('Login failure: ' + json.serviceResponse.authenticationFailure.description)
      buildUnauthorized(response)
      return
    }
    var guid = json.serviceResponse.authenticationSuccess.attributes.theKeyGuid[0].toLowerCase()
    buildJwt(guid, response)
  })
}

const validateTicket = (serviceTicket, callback) => {
  var path = '/cas/p3/serviceValidate'
  var service = 'service=' + process.env.THE_KEY_SERVICE_URL
  var ticket = 'ticket=' + serviceTicket
  const format = 'format=JSON'
  const options = {
    hostname: 'thekey.me',
    path: path + '?' + service + '&' + ticket + '&' + format,
    method: 'GET'
  }

  var request = https.request(options, (response) => {
    response.setEncoding('utf8')

    response.on('data', (data) => {
      callback(data)
    })
  })

  request.on('error', (error) => {
    logger.error(error)
    callback(null)
  })

  request.end()
}

const buildJwt = (guid, response) => {
  jwt.sign({ guid: guid }, process.env.JWT_SECRET, { expiresIn: '1h' }, (error, token) => {
    if (error) {
      logger.error(error)
      buildInternalErrorResponse(response)
    } else {
      response.json(token)
    }
  })
}

const buildUnauthorized = (response) => {
  response.status(401)
  response.json({
    message: 'Unauthorized'
  })
}

const buildInternalErrorResponse = (response) => {
  response.status(500)
  response.json({
    message: 'Internal Server Error'
  })
}

module.exports = { get: get, post: post }
