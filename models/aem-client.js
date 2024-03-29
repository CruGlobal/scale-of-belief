'use strict'

const request = require('request')

class AemClient {
  constructor (baseUrl, username, password) {
    this.baseUrl = baseUrl
    this.username = username
    this.password = password
  }

  /**
   * Updates the given page in AEM with the given score.
   *
   * @param uri a Url object of the page to update
   * @param score an integer value representing the score
   */
  updateScore (uri, score) {
    const auth = 'Basic ' + Buffer.from(this.username + ':' + this.password).toString('base64')

    const options = {
      url: `${this.baseUrl}/bin/cru/content-scoring/sync`,
      form: this.scoreBody(score, uri),
      headers: {
        authorization: auth
      }
    }
    return new Promise((resolve, reject) => {
      request.post(options, (err, response, body) => {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      })
    })
  }

  scoreBody (score, uri) {
    return {
      score,
      resourceUri: uri
    }
  }
}

module.exports = AemClient
