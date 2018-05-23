'use strict'

const ApiUser = require('../../models/api-user')
const https = require('https')
const xml2js = require('xml2js')

const get = (request, response) => {
  const guid = request.query['guid']
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

const post = (request, response) => {
  let requestBody = request.body

  // lookup guid
  if (!requestBody.guid && requestBody.contact_email) {
    const req = https.get('https://thekey.me/cas/api/' + process.env.THE_KEY_API_KEY + '/user/attributes?email=' + requestBody.contact_email, (res) => {
      if (res.statusCode !== 200) {
        response.status(res.statusCode)
        response.end(res.statusCode === 404 ? 'The email used is not an existing Key user account.' : 'Guid lookup error')
        return
      }

      res.on('data', (d) => {
        // parse response xml to get guid
        xml2js.parseString(d.toString(), (err, result) => {
          if (!err && result && result['attributes'] && result['attributes']['attribute']) {
            const attributes = result['attributes']['attribute']
            attributes.forEach((attr) => {
              if (attr['$']['name'] === 'ssoGuid') {
                requestBody.guid = attr['$']['value'].toLowerCase()
              }
            })
          }

          ApiUser.save(requestBody).then(() => {
            response.json(requestBody)
          })
        })
      })
    })

    req.end()
  } else {
    ApiUser.save(requestBody).then(() => {
      response.json(requestBody)
    })
  }
}

module.exports = {
  get: get,
  post: post
}
