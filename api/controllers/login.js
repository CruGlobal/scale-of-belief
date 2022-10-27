'use strict'

/* global fetch */
const jwt = require('jsonwebtoken')
const logger = require('../../config/logger')
const util = require('../util/util')

/* istanbul ignore next */
const get = (request, response) => {
  request.body = {
    access_token: request.query.access_token
  }

  post(request, response)
}

const post = (request, response) => {
  const accessToken = request.body.access_token

  if (!accessToken) {
    util.buildUnauthorizedResponse(response)
    return
  }

  lookupProfile(accessToken).then(({ profile, error }) => {
    if (error?.unauthorized) {
      logger.debug('Login failure: unauthorized')
      util.buildUnauthorizedResponse(response)
      return
    }

    const guid = profile?.ssoguid
    if (!guid) {
      util.buildInternalErrorResponse(response)
      return
    }
    buildJwt(guid, response)
  }).catch(() => {
    util.buildInternalErrorResponse(response)
  })
}

async function lookupProfile (accessToken) {
  const res = await fetch(`${process.env.OKTA_ISSUER}/v1/userinfo`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })
  if (res.ok) {
    return {
      profile: await res.json()
    }
  } else if (res.status === 401) {
    return {
      error: {
        unauthorized: true
      }
    }
  }

  throw new Error('Error looking up user profile')
}

const buildJwt = (guid, response) => {
  jwt.sign({ guid }, process.env.JWT_SECRET, { expiresIn: '1h' }, (error, token) => {
    if (error) {
      logger.error(error)
      util.buildInternalErrorResponse(response)
    } else {
      response.json(token)
    }
  })
}

module.exports = { get, post }
