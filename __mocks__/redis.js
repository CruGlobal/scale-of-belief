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
  }

  get (key, callback) {
    callback(null, dataStore[key])
  }

  set (key, value, callback) {
    dataStore[key] = value
    callback(null, null)
  }

  quit () {
    this.connected = false
    super.emit('end')
  }
}

module.exports = {
  createClient: (port, address) => {
    return new RedisClient()
  }
}
