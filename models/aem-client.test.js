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
    const resourceUrl = url.parse('http://some-site.org/content/siteName/path/pageName.html')

    it('Should successfully update the score in AEM', done => {
      const requestMock = jest.spyOn(request, 'post').mockImplementationOnce((options, callback) => {
        callback(null, {}, {})
      })

      const currentDate = new Date()

      const RealDate = Date
      global.Date = jest.fn(() => new RealDate(currentDate.toISOString()))

      const options = {
        url: 'http://localhost:4502/content/siteName/path/pageName/_jcr_content',
        form: {
          './score': 5,
          './contentScoreLastUpdated': new Date()
        },
        headers: {
          'authorization': auth
        }
      }

      client.updateScore(resourceUrl, 5).then(() => {
        expect(requestMock).toHaveBeenCalledWith(options, expect.any(Function))
        Object.assign(Date, RealDate)
        done()
      }).catch((err) => {
        Object.assign(Date, RealDate)
        done.fail(err)
      })
    })

    it('Should fail to update the score in AEM', done => {
      const requestMock = jest.spyOn(request, 'post').mockImplementationOnce((options, callback) => {
        callback(new Error('Failed to send'), {}, {})
      })

      client.updateScore(resourceUrl, 5).then(() => {
        done.fail(new Error('It should have failed'))
      }).catch((err) => {
        expect(requestMock).toHaveBeenCalled()
        done()
      })
    })
  })

  describe('publish', () => {
    const client = new AemClient(aemUrl, username, password)
    const resourceUrl = url.parse('http://some-site.org/content/siteName/path/pageName.html')

    it('Should successfully publish the changes', done => {
      const options = {
        url: 'http://localhost:4502/bin/replicate.json',
        form: {
          path: '/content/siteName/path/pageName',
          cmd: 'activate'
        },
        headers: {
          'authorization': auth
        }
      }
      const requestMock = jest.spyOn(request, 'post').mockImplementationOnce((options, callback) => {
        callback(null, {}, {})
      })

      client.publish(resourceUrl).then(() => {
        expect(requestMock).toHaveBeenCalledWith(options, expect.any(Function))
        done()
      }).catch((err) => {
        done.fail(err)
      })
    })

    it('Should fail to publish the changes', done => {
      const requestMock = jest.spyOn(request, 'post').mockImplementationOnce((options, callback) => {
        callback(new Error('Failed to publish'), {}, {})
      })

      client.publish(resourceUrl).then(() => {
        done.fail(new Error('It should have failed'))
      }).catch((err) => {
        expect(requestMock).toHaveBeenCalled()
        done()
      })
    })
  })
})
