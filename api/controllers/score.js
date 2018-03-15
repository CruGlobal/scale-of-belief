'use strict'

module.exports = {
  get: function (request, response) {
    response.json(
      '{' +
        '"uri": "string",' +
        '"score": {' +
          '"unaware": 0,' +
          '"curious": 0,' +
          '"follower": 0,' +
          '"guide": 0,' +
          '"confidence": 0' +
        '}' +
      '}')
  },

  post: function (request, response) {

  }
}
