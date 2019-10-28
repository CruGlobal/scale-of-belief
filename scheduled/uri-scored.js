'use strict'

const AWS = require('aws-sdk');
const Score = require('../models/score')
var awsConfig = require('aws-config');

//load configuration file from path
const awsConfigJson = require('../config/s3-config.json');
const s3bucket = new AWS.S3(awsConfig(awsConfigJson));

/**
 * a function to get all URI scored and unscored from the database
 */
module.exports.handler = async (lambdaEvent) => {
  const path = lambdaEvent.queryStringParameters.path;
  const bucketName = lambdaEvent.queryStringParameters.bucketName;
  await Score.getAllScores().then( (response) => {
    
    var data = Buffer.from(response);
    var param = {
      Bucket: bucketName,
      Key: path,
      Body: data
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