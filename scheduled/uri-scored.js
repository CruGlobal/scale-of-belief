'use strict'

const Score = require('../models/score')
const ObjectsToCsv = require('objects-to-csv');

/**
 * a function to get all URI scored and unscored from the database
 */
module.exports.handler = async (lambdaEvent) => {
  console.log(Score.getAllScores());
  // console.log(data);
  var data = [ { uri: 'movementlife.org', weight: 0, score: 2 },
  { uri: 'boilingwaters.ph', weight: 2, score: 2 } ];
  const csv = new ObjectsToCsv(data);
  // Save to file:
  await csv.toDisk('test.csv');
  // Return the CSV file as string:
  console.log(await csv.toString());

  // console.log(data);
  // csvWriter
  // .writeRecords(data)
  // .then(()=> console.log('The CSV file was written successfully'));
}
