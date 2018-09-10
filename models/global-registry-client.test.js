'use strict'

const GlobalRegistryClient = require('./global-registry-client')
const request = require('request')

describe('GlobalRegistryClient', () => {
  it('should be defined', () => {
    expect(GlobalRegistryClient).toBeDefined()
  })

  describe('constructor', () => {
    it('should set baseUrl and apiKey', () => {
      let client = new GlobalRegistryClient('https://example.com', 'abc123')

      expect(client.baseUrl).toEqual('https://example.com')
      expect(client.apiKey).toEqual('abc123')
    })
  })

  describe('updatePlacement()', () => {
    let requestMock, client
    beforeEach(() => {
      requestMock = jest.spyOn(request, 'post')
      client = new GlobalRegistryClient('https://example.com', 'abc123')
    })

    describe('user with multiple \'gr_master_person_id\'', () => {
      beforeEach(() => {
        requestMock.mockReset()
      })

      it('should POST both to Global Registry', () => {
        requestMock.mockReturnThis()
        let promise = client.updatePlacement(['abc123', 'zyx987'], 6)
        expect(requestMock).toHaveBeenCalledTimes(2)
        requestMock.mock.calls[0][1](undefined, '', '')
        requestMock.mock.calls[1][1](undefined, '', '')
        return promise
      })
    })

    describe('user with a \'gr_master_person_id\'', () => {
      beforeEach(() => {
        requestMock.mockReset()
      })

      it('should POST to Global Registry', () => {
        requestMock.mockReturnThis()
        let promise = client.updatePlacement(['def456'], 3)
        expect(requestMock).toHaveBeenCalledTimes(1)
        requestMock.mock.calls[0][1](undefined, '', '')
        return promise
      })
    })
  })

  describe('placementBody', () => {
    let client
    beforeEach(() => {
      client = new GlobalRegistryClient('https://example.com', 'abc123')
    })

    describe('placement with value', () => {
      it('build the correct POST body', () => {
        let placement = 6

        expect(client.placementBody('1234567890', placement)).toMatchObject({
          entity: {
            scale_of_belief: {
              placement: 6,
              client_integration_id: '1234567890',
              'master_person:relationship': {
                master_person: '1234567890', client_integration_id: '1234567890'
              }
            }
          }
        })
      })
    })

    describe('placement without value', () => {
      it('build the correct POST body', () => {
        expect(client.placementBody('0987654321', null)).toMatchObject({
          entity: {
            scale_of_belief: {
              placement: null,
              client_integration_id: '0987654321',
              'master_person:relationship': {
                master_person: '0987654321',
                client_integration_id: '0987654321'
              }
            }
          }
        })
      })
    })
  })
})
