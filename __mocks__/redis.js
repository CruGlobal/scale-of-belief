'use strict'

const EventEmitter = require('events')

const ACCESS_TOKEN = 'access-token'
const dataStore = {
  'scale-of-belief-lambda-campaign-access-token': ACCESS_TOKEN,
  'scale-of-belief-lambda:redshift-last-success:events': '2018-09-11T15:08:11.518Z',
  'scale-of-belief-lambda:redshift-last-success:scores': '2018-09-11T15:08:10.423Z'
}

class RedisClient extends EventEmitter {
  constructor () {
    super()
    this.connected = true
    this.withError = false
  }

  get (key, callback) {
    callback(null, dataStore[key])
  }

  set (key, value, callback) {
    if (this.withError) {
      this.emitError()
    } else {
      dataStore[key] = value
    }
    callback(this.withError, null)
  }

  quit () {
    this.connected = false
    super.emit('end')
  }

  emitError () {
    super.emit('error', new Error('whoops!'))
  }
}

function buildMock (withError) {
  const mock = new RedisClient()
  if (withError) {
    mock.withError = true
  }
  return mock
}

module.exports = {
  createClient: (port, address) => {
    const withError = address === '192.168.1.0'
    return buildMock(withError)
  }
}
