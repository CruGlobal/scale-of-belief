'use strict'

const AemClient = require('../config/aem')
const SyncScore = require('./sync-score')
const url = require('url')

describe('Sync-Score SNS Lambda', () => {
  it('Should be defined', () => {
    expect(SyncScore).toBeDefined()
  })

  const payload = {
    uri: 'http://localhost:4502/content/siteName/us/en/pageName.html',
    score: 5
  }
  const snsMessage = {
    Records: [
      {
        Sns: {
          Message: JSON.stringify(payload)
        }
      }
    ]
  }

  it('Should send the score to AEM author', done => {
    jest.spyOn(AemClient, 'updateScore').mockResolvedValue()

    SyncScore.handler(snsMessage).then(() => {
      expect(AemClient.updateScore).toHaveBeenCalledWith(url.parse(payload.uri), payload.score)
      done()
    }).catch((err) => {
      done.fail(err)
    })
  })

  it('Should fail to send the score to AEM author', done => {
    jest.spyOn(AemClient, 'updateScore').mockRejectedValue(new Error('Failed to send'))

    SyncScore.handler(snsMessage).then(() => {
      done.fail(new Error('It should have failed'))
    }).catch((err) => {
      expect(err).toEqual(new Error('Failed to send'))
      done()
    })
  })
})
