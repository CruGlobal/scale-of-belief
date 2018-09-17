'use strict'

const GlobalRegistry = require('../config/global-registry')
const globalRegistryLambda = require('./global-registry')

describe('Global Registry lambda', () => {
  it('Should be defined', () => {
    expect(globalRegistryLambda).toBeDefined()
  })

  const payload = {
    placement: 8,
    grMasterPersonIds: ['some-gr-id']
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

  it('Should successfully send a placement to global registry', done => {
    jest.spyOn(GlobalRegistry, 'updatePlacement').mockImplementationOnce(() => {
      return Promise.resolve()
    })

    globalRegistryLambda.handler(snsMessage).then((message) => {
      done()
    }).catch((error) => {
      done.fail(error)
    })
  })

  it('Should fail to send a placement to global registry', done => {
    jest.spyOn(GlobalRegistry, 'updatePlacement').mockImplementationOnce(() => {
      return Promise.reject(new Error('Failed to call Global Registry'))
    })

    globalRegistryLambda.handler(snsMessage).then((message) => {
      done.fail(new Error('It should have failed'))
    }).catch(() => {
      done()
    })
  })
})
