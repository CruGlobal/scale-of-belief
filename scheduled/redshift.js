'use strict'

/**
 * Lambda handler to move data into Redshift.
 */

const {Client} = require('pg')
const copyToSteam = require('pg-copy-streams').to
const rollbar = require('../config/rollbar')
const AWS = require('aws-sdk')
const redis = require('redis')
const zlib = require('zlib')
const {castArray, map} = require('lodash')

const LAST_SUCCESS_PREFIX = 'scale-of-belief-lambda:redshift-last-success:'
const STAGING_PREFIX = 'staging_'

const buildFormattedDate = (date) => {
  return date.getUTCFullYear() + '-' +
    getZeroPaddedValue(date.getUTCMonth() + 1) + '-' +
    getZeroPaddedValue(date.getUTCDate()) + '-' +
    getZeroPaddedValue(date.getUTCHours()) + '-' +
    getZeroPaddedValue(date.getUTCMinutes()) + '-' +
    getZeroPaddedValue(date.getUTCSeconds())
}

const getZeroPaddedValue = (original) => {
  return ('0' + original).slice(-2)
}

module.exports.handler = rollbar.lambdaHandler((lambdaEvent, lambdaContext, lambdaCallback) => {
  // Configure AWS and S3
  AWS.config.update({region: 'us-east-1'})
  const s3 = new AWS.S3({apiVersion: '2006-03-01'})

  // Configure redis client
  const redisClient = redis.createClient(
    process.env.REDIS_PORT_6379_TCP_ADDR_PORT,
    process.env.REDIS_PORT_6379_TCP_ADDR
  )
  redisClient.on('error', err => {
    throw err
  })

  /**
   * Gets last success for given table
   * @param {String} table
   * @returns {Promise<*>}
   */
  const getLastSuccess = async (table) => {
    return new Promise(resolve => {
      redisClient.get(LAST_SUCCESS_PREFIX + table, (err, value) => {
        if (err instanceof Error) {
          throw err
        }
        if (value === null) {
          // key missing, default to 10 minutes ago
          resolve(new Date(Date.now() - (10 * 60 * 1000)).toISOString())
        } else {
          resolve(value)
        }
      })
    })
  }

  /**
   * Set last success for given table
   * @param {String} table
   * @param {Date} date
   * @returns {Promise<*>}
   */
  const setLastSuccess = async (table, date) => {
    return new Promise(resolve => {
      redisClient.set(LAST_SUCCESS_PREFIX + table, date.toISOString(), (err, res) => {
        if (err instanceof Error) {
          throw err
        }
        resolve()
      })
    })
  }

  /**
   * Copy data from postgres to s3
   * @param {String} table
   * @param {String} s3Key
   * @returns {Promise<boolean>} true if data was copied, false otherwise
   */
  const copyToS3 = async (table, s3Key) => {
    const lastSuccess = await getLastSuccess(table)
    const QUERY =
      `COPY (SELECT * FROM ${table} WHERE updated_at >= '${lastSuccess}') TO STDOUT WITH(FORMAT CSV, HEADER false);`
    const postgresClient = new Client({
      user: process.env.DB_ENV_POSTGRESQL_USER,
      password: process.env.DB_ENV_POSTGRESQL_PASS,
      database: process.env.DB_ENV_POSTGRESQL_DB,
      host: process.env.DB_PORT_5432_TCP_ADDR || /* istanbul ignore next */ 'localhost',
      port: process.env.DB_PORT_5432_TCP_PORT || /* istanbul ignore next */ 5432
    })
    await postgresClient.connect()
    try {
      let body = (await postgresClient.query(copyToSteam(QUERY))).pipe(zlib.createGzip())
      await s3.upload({
        Bucket: process.env.REDSHIFT_S3_BUCKET,
        Key: s3Key,
        Body: body
      }).promise()
      return body.bytesRead !== 0
    } finally {
      // Always disconnect from postgres
      await postgresClient.end()
    }
  }

  /**
   * Copy data from S3 into redshift
   * @param {String} table
   * @param {String} idColumn
   * @param {String} s3Key
   * @returns {Promise<void>}
   */
  const copyToRedshift = async (table, idColumn, s3Key) => {
    const CREATE_TABLE_QUERY =
      `CREATE TEMP TABLE ${STAGING_PREFIX}${table} (LIKE scale_of_belief.${table})`
    const COPY_FROM_QUERY =
      `COPY ${STAGING_PREFIX}${table}
      FROM 's3://${process.env.REDSHIFT_S3_BUCKET}/${s3Key}'
      IAM_ROLE '${process.env.REDSHIFT_IAM_ROLE}'
      CSV BLANKSASNULL EMPTYASNULL TRUNCATECOLUMNS COMPUPDATE OFF STATUPDATE OFF GZIP`
    const DELETE_CONDITIONS = map(castArray(idColumn), (column) => {
      return `scale_of_belief.${table}.${column} = ${STAGING_PREFIX}${table}.${column}`
    }).join(' AND ')
    const DELETE_QUERY =
      `DELETE FROM scale_of_belief.${table}
      USING ${STAGING_PREFIX}${table}
      WHERE ${DELETE_CONDITIONS}`
    const INSERT_QUERY =
      `INSERT INTO scale_of_belief.${table} SELECT * FROM ${STAGING_PREFIX}${table}`
    const DROP_TABLE_QUERY = `DROP TABLE IF EXISTS ${STAGING_PREFIX}${table}`
    const redshiftClient = new Client({
      user: process.env.REDSHIFT_DB_ENV_POSTGRESQL_USER,
      password: process.env.REDSHIFT_DB_ENV_POSTGRESQL_PASS,
      database: process.env.REDSHIFT_DB_ENV_POSTGRESQL_DB,
      host: process.env.REDSHIFT_DB_PORT_5432_TCP_ADDR,
      port: process.env.REDSHIFT_DB_PORT_5432_TCP_PORT
    })
    await redshiftClient.connect()
    try {
      await redshiftClient.query('BEGIN')
      await redshiftClient.query(CREATE_TABLE_QUERY)
      await redshiftClient.query(COPY_FROM_QUERY)
      await redshiftClient.query(DELETE_QUERY)
      await redshiftClient.query(INSERT_QUERY)
      await redshiftClient.query(DROP_TABLE_QUERY)
      await redshiftClient.query('COMMIT')
    } catch (err) {
      await redshiftClient.query('ROLLBACK')
      throw err
    } finally {
      await redshiftClient.end()
    }
  }

  /**
   * Initiate a delta from postgres to redshift
   * @param table
   * @param idColumn(s)
   * @returns {Promise<void>}
   */
  const redshiftDelta = async (table, idColumn) => {
    const now = new Date()
    let s3Key = `${table}/${buildFormattedDate(now)}.csv.gz`
    let result = await copyToS3(table, s3Key)
    if (result) {
      await copyToRedshift(table, idColumn, s3Key)
    }
    // Set last success to now() - 6 minutes, this will add delta overlap to prevent missing data
    await setLastSuccess(table, new Date(now - 1000 * 360))
  }

  Promise.all([
    redshiftDelta('events', 'id'),
    redshiftDelta('scores', 'uri'),
    redshiftDelta('user_audits', ['id', 'old_id'])
  ]).then(deltas => {
    redisClient.quit()
    lambdaCallback(null, 'Redshift deltas successful.')
  }, err => {
    redisClient.quit()
    rollbar.error('Redshift: ' + err)
    lambdaCallback(err)
  })
})
