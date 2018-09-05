'use strict'

/**
 * Lambda handler to move data into Redshift.
 */

const { Client } = require('pg')
const copyTo = require('pg-copy-streams').to
const rollbar = require('../config/rollbar')
const concat = require('concat-stream')
const AWS = require('aws-sdk')
const dateUtil = require('./util/date-util')
const redis = require('redis')

const LAST_SUCCESS_KEY = 'scale-of-belief-redshift-lambda-last-success'

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  AWS.config.update({region: 'us-east-1'})
  const s3 = new AWS.S3({apiVersion: '2006-03-01'})
  const bucketDate = dateUtil.buildFormattedDate(new Date())

  const redshiftClient = new Client({
    user: process.env.REDSHIFT_DB_ENV_POSTGRESQL_USER,
    password: process.env.REDSHIFT_DB_ENV_POSTGRESQL_PASS,
    database: process.env.REDSHIFT_DB_ENV_POSTGRESQL_DB,
    host: process.env.REDSHIFT_DB_PORT_5432_TCP_ADDR,
    port: process.env.REDSHIFT_DB_PORT_5432_TCP_PORT
  })

  const redisClient = redis.createClient(process.env.REDIS_PORT_6379_TCP_ADDR_PORT, process.env.REDIS_PORT_6379_TCP_ADDR)

  const shouldAbort = (error) => {
    if (error) {
      rollbar.error('Error in transaction: ', error)
      redshiftClient.query('ROLLBACK', (error) => {
        if (error) {
          rollbar.error('Error rolling back: ', error)
        }
      })
    }
    return !!error
  }

  const commit = async () => {
    return new Promise((resolve, reject) => {
      redshiftClient.query('COMMIT').then(() => {
        resolve()
      })
      .catch((error) => {
        throw new Error('Error committing transaction: ' + error)
      })
    })
  }

  const createStagingTable = async (stagingTable, permanentTable) => {
    return new Promise((resolve, reject) => {
      const createQuery = `CREATE TEMP TABLE ${stagingTable} (LIKE scale_of_belief.${permanentTable})`
      redshiftClient.query(createQuery).then(() => {
        resolve()
      })
      .catch((error) => {
        if (shouldAbort(error)) {
          throw new Error(error)
        }
      })
    })
  }

  const copyDataFromS3 = async (stagingTable, bucketFolder) => {
    const copyFromS3 =
      `COPY ${stagingTable}
      FROM '${process.env.REDSHIFT_S3_BUCKET}/${bucketFolder}/${bucketDate}.csv'
      IAM_ROLE '${process.env.REDSHIFT_IAM_ROLE}'
      CSV IGNOREHEADER 1 BLANKSASNULL EMPTYASNULL TRUNCATECOLUMNS COMPUPDATE OFF STATUPDATE OFF`

    return new Promise((resolve, reject) => {
      redshiftClient.query(copyFromS3).then(() => {
        resolve()
      })
      .catch((error) => {
        if (shouldAbort(error)) {
          throw new Error(error)
        }
      })
    })
  }

  const mergeDataIntoPermanentTable = async (stagingTable, permanentTable, primaryKey) => {
    const deleteQuery =
      `DELETE FROM scale_of_belief.${permanentTable}
      USING ${stagingTable}
      WHERE scale_of_belief.${permanentTable}.${primaryKey} = ${stagingTable}.${primaryKey}`

    const insertQuery =
      `INSERT INTO scale_of_belief.${permanentTable}
      SELECT * FROM ${stagingTable}`

    return new Promise((resolve, reject) => {
      redshiftClient.query(deleteQuery).then(() => {
        redshiftClient.query(insertQuery).then(() => {
          resolve()
        })
        .catch((error) => {
          if (shouldAbort(error)) {
            throw new Error(error)
          }
        })
      })
      .catch((error) => {
        if (shouldAbort(error)) {
          throw new Error(error)
        }
      })
    })
  }

  const dropTable = async (tableName) => {
    return new Promise((resolve, reject) => {
      redshiftClient.query('DROP TABLE ' + tableName).then(() => {
        resolve()
      })
      .catch((error) => {
        if (shouldAbort(error)) {
          throw new Error(error)
        }
      })
    })
  }

  const moveData = async (tableName, stagingTable, primaryKey) => {
    const now = Date.now()
    let lowerThreshold = new Date(now - (10 * 60 * 1000)).toISOString() // default to 10 minutes ago

    return new Promise((resolve, reject) => {
      redisClient.on('error', (error) => {
        throw new Error('Error connecting to Redis: ' + error)
      })

      redisClient.get(LAST_SUCCESS_KEY, (error, response) => {
        if (error) {
          throw new Error(`Error retrieving ${LAST_SUCCESS_KEY}: ${error}`)
        }

        if (response) {
          lowerThreshold = response
        }
      })

      const copyQuery = `COPY (
        SELECT *
        FROM ${tableName}
        WHERE updated_at >= '${lowerThreshold}')
        TO STDOUT WITH(FORMAT CSV, HEADER);`

      const localDbClient = new Client({
        user: process.env.DB_ENV_POSTGRESQL_USER,
        password: process.env.DB_ENV_POSTGRESQL_PASS,
        database: process.env.DB_ENV_POSTGRESQL_DB,
        host: process.env.DB_PORT_5432_TCP_ADDR || 'localhost',
        port: process.env.DB_PORT_5432_TCP_PORT || 5432
      })

      localDbClient.connect()

      let stream = localDbClient.query(copyTo(copyQuery))
      let response

      stream.pipe(concat((buffer) => {
        response = buffer.toString('utf8')
      }))

      stream.on('error', (error) => {
        throw new Error('Stream error: ' + error)
      })
      stream.on('end', () => {
        localDbClient.end()
        s3.putObject({
          Bucket: 'scale-of-belief-lambda-' + process.env.ENVIRONMENT,
          Key: tableName + '/' + bucketDate + '.csv',
          Body: response
        }, function (error, data) {
          if (error) {
            throw new Error('Failed to send CSV to S3: ' + error)
          } else {
            // Move data from S3 to Redshift
            redshiftClient.query('BEGIN').then(async () => {
              try {
                // Create temporary staging table with the CSV data from S3
                await createStagingTable(stagingTable, tableName)
                await copyDataFromS3(stagingTable, tableName)

                // Merge data from temporary table into the permanent table
                await mergeDataIntoPermanentTable(stagingTable, tableName, primaryKey)

                // Drop the temporary table
                await dropTable(stagingTable)

                await commit()
                resolve()
              } catch (error) {
                throw new Error('Failed to get data into Redshift: ' + error)
              }
            })
            .catch((error) => {
              throw new Error('Failed to begin transaction in Redshift: ' + error)
            })
          }
        })
      })
    })
  }

  const updateLastSuccess = async () => {
    return new Promise((resolve, reject) => {
      redisClient.on('error', (error) => {
        throw new Error('Error connecting to Redis: ' + error)
      })

      redisClient.set(LAST_SUCCESS_KEY, new Date(Date.now()).toISOString())
      resolve()
    })
  }

  const workingFunction = async () => {
    try {
      await redshiftClient.connect()
    } catch (error) {
      throw new Error('Error connecting to Redshift client: ' + error)
    }

    try {
      await moveData('scores', 'score_staging', 'uri')
      await moveData('events', 'event_staging', 'id')
      await updateLastSuccess()
    } catch (error) {
      throw new Error(error)
    }

    redshiftClient.end().then(() => {
      redisClient.quit()
      lambdaCallback(null, 'Move to Redshift successful')
    })
    .catch((error) => {
      throw new Error('Failed to disconnect from Redshift client: ' + error)
    })
  }

  workingFunction().catch((error) => {
    redshiftClient.end().then(() => {
      redisClient.quit()
      lambdaCallback('Failed to move data to Redshift: ' + error)
    })
    .catch((redshiftDisconnectError) => {
      lambdaCallback('Failed to disconnect from Redshift client: ' + redshiftDisconnectError)
    })
  })
})
