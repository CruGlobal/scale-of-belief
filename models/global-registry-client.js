'use strict'

const request = require('request')
const {forEach} = require('lodash')

request.debug = true

class GlobalRegistryClient {
  constructor (baseUrl, apiKey) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  updatePlacement (masterPersonIds, placement) {
    const requests = []

    forEach(masterPersonIds, (masterPersonId) => {
      const promise = new Promise(resolve => {
        let options = {
          url: `${this.baseUrl}/entities`,
          body: JSON.stringify(this.placementBody(masterPersonId, placement)),
          headers: {
            'authorization': `Bearer ${this.apiKey}`,
            'content-type': 'application/json'
          }
        }
        request.post(options, (err, response, body) => {
          // TODO: better handle response and error
          resolve(err || response)
        })
      })
      requests.push(promise)
    })
    return Promise.all(requests)
  }

  placementBody (masterPersonId, placement) {
    return {
      entity: {
        scale_of_belief: {
          placement: placement,
          client_integration_id: masterPersonId,
          'master_person:relationship': {
            master_person: masterPersonId,
            client_integration_id: masterPersonId
          }
        }
      }
    }
  }
}

module.exports = GlobalRegistryClient
