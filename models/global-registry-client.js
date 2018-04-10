'use strict'

const request = require('request')
const {assign, forEach} = require('lodash')

request.debug = true

class GlobalRegistryClient {
  constructor (baseUrl, apiKey) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  updatePlacement (placement) {
    const requests = []

    forEach(placement.user.gr_master_person_id, (masterPersonId) => {
      const promise = new Promise(resolve => {
        let options = {
          url: `${this.baseUrl}/entities`,
          json: true,
          body: this.postBody(masterPersonId, placement),
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
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

  postBody (masterPersonId, placement) {
    return {
      entity: {
        scale_of_belief: assign({
          placement: placement.placement || 'unaware',
          // TODO weighted_placement not added to staging GR entity yet
          // weighted_placement: placement.weightedPlacement || 'unaware'
          client_integration_id: masterPersonId,
          'master_person:relationship': {
            master_person: masterPersonId,
            client_integration_id: masterPersonId
          }
        }, placement.values, placement.weightedValues)
      }
    }
  }
}

module.exports = GlobalRegistryClient
