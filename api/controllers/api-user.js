'use strict'

const ApiUser = require('../../models/api-user')
const fetch = require('node-fetch')

// Lookup up a user by the email address and return a promise that
// resolves to their The Key guid if they exist, or rejects if they don't
async function lookupUser (emailAddress) {
  const search = `profile.email eq "${emailAddress.replaceAll('"', '')}"`
  const url = `https://signon.okta.com/api/v1/users?search=${encodeURIComponent(search)}`
  const res = await fetch(url, {
    headers: {
      authorization: `SSWS ${process.env.OKTA_API_TOKEN}`
    }
  })
  if (!res.ok) {
    const error = new Error('Guid lookup error')
    error.status = res.statusCode
    throw error
  }
  const data = await res.json()
  const guid = data[0]?.profile?.theKeyGuid
  if (!guid) {
    const error = new Error('The email used is not an existing Okta user account.')
    error.status = res.statusCode === 200 ? 404 : res.statusCode
    throw error
  }
  return guid
}

const get = (request, response) => {
  const guid = request.query.guid
  ApiUser.retrieve(guid).then((user) => {
    if (user) {
      response.json(user)
    } else {
      response.status(404)
      response.json({
        message: 'Not Found'
      })
    }
  })
}

const post = async (request, response) => {
  const requestBody = request.body

  // lookup guid
  if (!requestBody.guid && requestBody.contact_email) {
    requestBody.guid = await lookupUser(requestBody.contact_email)
  }

  await ApiUser.save(requestBody)
  response.json(requestBody)
}

module.exports = {
  get,
  post
}
