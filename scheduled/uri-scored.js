'use strict'

const AWS = require('aws-sdk')
const rollbar = require('../config/rollbar')
const Score = require('../models/score')
const Unscored = require('../models/unscored')
const ObjectsToCsv = require('objects-to-csv')
const s3bucket = new AWS.S3({apiVersion: '2006-03-01'})

/**
 * a function to get all URI scored and unscored from the database
 * returns a -1 for unscored uris
 * author: jonahkjala
 */
module.exports.handler = async (lambdaEvent) => {
  const path = 'scores.csv'
  const bucketName = process.env.S3_SCORED_URIS_BUCKET

  var unscored = []
  var scored = []
  var allUris = []

  await Unscored.getAllUris().then((response) => {
    unscored = response
  })
  await Score.getAllScores().then((response) => {
    scored = response
    allUris = scored.concat(unscored)
  })

  await new ObjectsToCsv(allUris).toString().then((response) => {
    var csv = response
    var param = {
      Bucket: bucketName,
      Key: path,
      Body: csv
    }

    s3bucket.putObject(param, function (err, response) {
      let result = ''
      if (err) {
        rollbar.error('Upload csv error: ' + err, err)
        result = 'error'
        throw err
      } else {
        rollbar.warn(response)
        result = 'success'
      }
      return result
    })
  })
}
