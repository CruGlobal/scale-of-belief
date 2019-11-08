'use strict'

const AWS = require('aws-sdk');
const Score = require('../models/score')
const Unscored = require('../models/unscored')
const ObjectsToCsv = require('objects-to-csv');

//load configuration file from path
const awsConfigJson = require('../config/s3-config.json');
const s3bucket = new AWS.S3(awsConfig(awsConfigJson));

/**
 * a function to get all URI scored and unscored from the database
 * returns a -1 for unscored uris
 */
module.exports.handler = async (lambdaEvent) => {
  const path = lambdaEvent.queryStringParameters.path;
  const bucketName = lambdaEvent.queryStringParameters.bucketName;
  var unscored = [];
  var scored = [];
  var allUris = [];

  await Unscored.getAllUris().then((response) => {
    unscored = response;
  })
  await Score.getAllScores().then( (response) => {
    scored = response;
    allUris = scored.concat(unscored);
  }) 

  await new ObjectsToCsv(allUris).toDisk(path).then((response) => {
    // var data = Buffer.from(allUris);
    // var csv = printCsv(allUris);
    var csv = response;
    console.log(csv);
    console.log(typeof(csv));
    // var data = Buffer.from(csv);
    var param = {
      Bucket: bucketName,
      Key: path,
      Body: csv
    };

    s3bucket.putObject(param, function(err, response) {
      if(err) {
        console.error(err);
      } else {
        console.log(response)
      }
    });  
  }) 
}