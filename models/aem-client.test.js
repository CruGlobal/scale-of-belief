'use strict'

const AemClient = require('./aem-client')
const request = require('request')
const url = require('url')

describe('AemClient', () => {
  it('Should be defined', () => {
    expect(AemClient).toBeDefined()
  })

  const aemUrl = 'http://localhost:4502'
  const username = 'username'
  const password = 'password'
  const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64')

  describe('constructor', () => {
    it('Should set url, username, and password', () => {
      const client = new AemClient(aemUrl, username, password)

      expect(client.baseUrl).toEqual(aemUrl)
      expect(client.username).toEqual(username)
      expect(client.password).toEqual(password)
    })
  })

  describe('updateScore', () => {
    const client = new AemClient(aemUrl, username, password)
    const resourceUrl = new url.URL('http://some-site.org/content/siteName/path/pageName.html')

    it('Should successfully update the score in AEM', done => {
      const requestMock = jest.spyOn(request, 'post').mockImplementationOnce((options, callback) => {
        callback(null, {}, {})
      })

      const options = {
        url: 'http://localhost:4502/bin/cru/content-scoring/sync',
        form: {
          score: 5,
          resourceUri: new url.URL(resourceUrl)
        },
        headers: {
          authorization: auth
        }
      }

      client.updateScore(resourceUrl, 5).then(() => {
        expect(requestMock).toHaveBeenCalledWith(options, expect.any(Function))
        done()
      }).catch((err) => {
        done.fail(err)
      })
    })

    it('Should fail to update the score in AEM', done => {
      const requestMock = jest.spyOn(request, 'post').mockImplementationOnce((options, callback) => {
        callback(new Error('Failed to send'), {}, {})
      })

      client.updateScore(resourceUrl, 5).then(() => {
        done.fail(new Error('It should have failed'))
      }).catch(() => {
        expect(requestMock).toHaveBeenCalled()
        done()
      })
    })
  })
})
