'use strict'

const Score = require('../../models/score')
const RecentlyScored = require('../../models/recently-scored')
const util = require('../util/util')
const {pick} = require('lodash')
const AWS = require('aws-sdk')
const rollbar = require('../../config/rollbar')

const get = (request, response) => {
  var uri = util.sanitizeUri(request.query['uri'])
  Score.retrieve(uri).then((score) => {
    if (score) {
      response.json(Score.toApiScore(score))
    } else {
      response.status(404)
      response.json({
        message: 'Not Found'
      })
    }
  })
}

const post = (request, response) => {
  var requestBody = request.body
  const sanitizedUri = util.sanitizeUri(requestBody.uri)

  Score.save(sanitizedUri, pick(requestBody, ['score', 'weight'])).then(async (result) => {
    await RecentlyScored.save(sanitizedUri, requestBody.score)

    try {
      await sendSns(sanitizedUri, requestBody.score)
    } catch (err) {
      // We don't want to fail the request if this fails, but we should probably log it
      rollbar.warn(err)
    }

    // On update, we will have a multi-dimensional array (first element being the version), on create we won't
    if (Array.isArray(result)) {
      response.json(Score.toApiScore(result[1][0].dataValues))
    } else {
      response.json(Score.toApiScore(result.dataValues))
    }
  })
}

const sendSns = async (sanitizedUri, score) => {
  const sns = new AWS.SNS({ region: 'us-east-1' })
  const payload = {
    uri: sanitizedUri,
    score: score
  }
  const params = {
    Message: JSON.stringify(payload),
    TopicArn: process.env.AEM_SNS_TOPIC_ARN
  }

  return new Promise((resolve, reject) => {
    sns.publish(params, (error, data) => {
      if (error) {
        reject(error)
      }
      resolve(data)
    })
  })
}

module.exports = {
  get: get,
  post: post
}
