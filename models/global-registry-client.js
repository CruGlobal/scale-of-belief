'use strict'

const { GRClient } = require('global-registry-nodejs-client')

class GlobalRegistryClient {
  constructor (baseUrl, apiKey) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.grClient = new GRClient({ baseUrl: baseUrl, accessToken: apiKey })
  }

  updatePlacement (masterPersonIds, placement) {
    const requests = masterPersonIds.map(masterPersonId =>
      this.grClient.Entity.post(GlobalRegistryClient.placementBody(masterPersonId, placement)))
    return Promise.all(requests)
  }

  static placementBody (masterPersonId, placement) {
    return {
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

module.exports = GlobalRegistryClient
