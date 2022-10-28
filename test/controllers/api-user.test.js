'use strict'

const ApiUserController = require('../../api/controllers/api-user.js')
const fetch = require('node-fetch')

jest.mock('node-fetch')

describe('ApiUserController', () => {
  it('should be defined', () => {
    expect(ApiUserController).toBeDefined()
  })

  describe('lookupUser', () => {
    it('should lookup the user via Okta', done => {
      const guid = 'guid'

      const mockedResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ profile: { theKeyGuid: guid } }])
      }
      fetch.mockImplementation(() => Promise.resolve(mockedResponse))

      ApiUserController.lookupUser('bill.bright@cru.org').then((foundGuid) => {
        expect(fetch).toHaveBeenCalledWith('https://signon.okta.com/api/v1/users?search=profile.email%20eq%20%22bill.bright%40cru.org%22', expect.anything())
        expect(foundGuid).toBe(guid)
        done()
      }).catch(done)
    })

    it('should strip quotation marks from the email address', done => {
      const guid = 'guid'

      const mockedResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ profile: { theKeyGuid: guid } }])
      }
      fetch.mockImplementation(() => Promise.resolve(mockedResponse))

      ApiUserController.lookupUser('"bill.bright"@"cru".org').then(() => {
        expect(fetch).toHaveBeenCalledWith('https://signon.okta.com/api/v1/users?search=profile.email%20eq%20%22bill.bright%40cru.org%22', expect.anything())
        done()
      }).catch(done)
    })

    it('should reject if Okta returns an error', done => {
      const mockedResponse = {
        ok: false,
        status: 500,
        json: () => Promise.resolve(null)
      }
      fetch.mockImplementation(() => Promise.resolve(mockedResponse))

      ApiUserController.lookupUser('bill.bright@cru.org').then(() => {
        done(new Error('Unexpected success'))
      }).catch((err) => {
        expect(err.toString()).toMatch('Guid lookup error')
        expect(err.status).toBe(500)
        done()
      })
    })

    it('should reject if no user was found', done => {
      const mockedResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve([])
      }
      fetch.mockImplementation(() => Promise.resolve(mockedResponse))

      ApiUserController.lookupUser('bill.bright@cru.org').then(() => {
        done(new Error('Unexpected success'))
      }).catch((err) => {
        expect(err.toString()).toMatch('The email used is not an existing Okta user account.')
        expect(err.status).toBe(404)
        done()
      })
    })
  })
})
