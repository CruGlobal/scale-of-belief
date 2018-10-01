'use strict'

const ApiKey = require('../../models/api-key')
const Recommendation = require('../../models/recommendation')
const {castArray, find} = require('lodash')
const util = require('../util/util')

module.exports = async (request, response, next) => {
  try {
    const key = request.query['apiKey']
    const id = request.query['id']
    if (!key || !id) throw new Error('Unauthorized')

    const [apiKey, recommendation] = await Promise.all([
      ApiKey.findOne({where: {api_key: key}}),
      Recommendation.findById(id)
    ])
    if (apiKey == null || recommendation == null) throw new Error('Unauthorized')

    if (apiKey.type === 'super') {
      next()
    } else {
      if (find(castArray(apiKey.api_pattern), (pattern) => recommendation.url.match(pattern) !== null) !== undefined) {
        next()
      } else {
        throw new Error('Unauthorized')
      }
    }
  } catch (error) {
    if (error.message === 'Unauthorized') {
      next(util.buildInvalidApiKey())
    } else {
      next(error)
    }
  }
}
