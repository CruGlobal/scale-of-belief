'use strict'

const GlobalRegistryClient = require('./global-registry-client')
const requestMock = require('request-promise-native')

describe('GlobalRegistryClient', () => {
  it('should be defined', () => {
    expect(GlobalRegistryClient).toBeDefined()
  })

  describe('constructor', () => {
    it('should set baseUrl and apiKey', () => {
      const client = new GlobalRegistryClient('https://example.com', 'abc123')

      expect(client.baseUrl).toEqual('https://example.com')
      expect(client.apiKey).toEqual('abc123')
    })
  })

  describe('updatePlacement()', () => {
    let client
    beforeEach(() => {
      client = new GlobalRegistryClient('https://example.com', 'abc123')
      requestMock.post.mockReset()
    })

    describe('user with multiple \'gr_master_person_id\'', () => {
      it('should POST both to Global Registry', () => {
        const promise = client.updatePlacement(['abc123', 'zyx987'], 6)
        expect(requestMock.post).toHaveBeenCalledTimes(2)
        expect(requestMock.post.mock.calls[0]).toEqual(
          ['/entities/', { body: { entity: GlobalRegistryClient.placementBody('abc123', 6) }, qs: {} }])
        expect(requestMock.post.mock.calls[1]).toEqual(
          ['/entities/', { body: { entity: GlobalRegistryClient.placementBody('zyx987', 6) }, qs: {} }])
        return promise
      })
    })

    describe('user with a \'gr_master_person_id\'', () => {
      it('should POST to Global Registry', () => {
        const promise = client.updatePlacement(['def456'], 3)
        expect(requestMock.post).toHaveBeenCalledTimes(1)
        expect(requestMock.post.mock.calls[0]).toEqual(
          ['/entities/', { body: { entity: GlobalRegistryClient.placementBody('def456', 3) }, qs: {} }])
        return promise
      })
    })
  })

  describe('placementBody', () => {
    describe('placement with value', () => {
      it('build the correct POST body', () => {
        const placement = 6

        expect(GlobalRegistryClient.placementBody('1234567890', placement)).toMatchObject({
          scale_of_belief: {
            placement: 6,
            client_integration_id: '1234567890',
            'master_person:relationship': {
              master_person: '1234567890', client_integration_id: '1234567890'
            }
          }
        })
      })
    })

    describe('placement without value', () => {
      it('build the correct POST body', () => {
        expect(GlobalRegistryClient.placementBody('0987654321', null)).toMatchObject({
          scale_of_belief: {
            placement: null,
            client_integration_id: '0987654321',
            'master_person:relationship': {
              master_person: '0987654321',
              client_integration_id: '0987654321'
            }
          }
        })
      })
    })
  })
})
