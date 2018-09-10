'use strict'

const EventEmitter = require('events')

const ACCESS_TOKEN = 'access-token'
const dataStore = { 'scale-of-belief-lambda-campaign-access-token': ACCESS_TOKEN }

class RedisClient extends EventEmitter {
  constructor () {
    super()
    this.connected = true
  }

  get (key, callback) {
    callback(null, dataStore[key])
  }

  set (key, value) {
    dataStore[key] = value
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
