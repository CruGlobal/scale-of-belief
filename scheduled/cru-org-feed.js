'use strict'

const rollbar = require('../config/rollbar')
const {Client} = require('pg')
const Transform = require('stream').Transform
const QueryStream = require('pg-query-stream')
const CSV = require('csv')
const AWS = require('aws-sdk')
const request = require('request-promise-native')
const {assign, find, map, zipObject} = require('lodash')
const prefixMatch = new RegExp('^https?://(www\\.)?cru\\.org(/content/cru)?', 'i')
const feedColumns = [
  'entity.id',
  'entity.name',
  'entity.categoryId',
  'entity.message',
  'entity.thumbnailUrl',
  'entity.value',
  'entity.pageUrl',
  'entity.inventory',
  'entity.margin',
  'entity.content_score',
  'entity.language',
  'entity.primary_category',
  'entity.sub_categories'
]
const csvHeader = `## RECSRecommendations Upload File
## RECS''## RECS'' indicates a Recommendations pre-process header. Please do not remove these lines.
## RECS
## RECSUse this file to upload product display information to Recommendations. Each product has its own row. Each line must contain 19 values and if not all are filled a space should be left.
## RECSThe last 100 columns (entity.custom1 - entity.custom100) are custom. The name 'customN' can be replaced with a custom name such as 'onSale' or 'brand'.
## RECSIf the products already exist in Recommendations then changes uploaded here will override the data in Recommendations. Any new attributes entered here will be added to the product''s entry in Recommendations.
## RECS${feedColumns.join(',')}
`
const scoresQuery = `SELECT MD5(lower(uri)) AS "entity.id", uri AS "entity.pageUrl", score AS "entity.content_score" FROM scores WHERE uri ~* $1`

module.exports.handler = async (lambdaEvent) => {
  try {
    // Configure AWS and S3
    AWS.config.update({region: 'us-east-1'})
    const s3 = new AWS.S3({apiVersion: '2006-03-01'})

    /**
     * Fetches cru.org json information through querybuilder
     * @returns {Promise<void>}
     */
    const getCruOrgJson = async () => {
      const hosts = ['prodpub1.aws.cru.org:4503', 'prodpub2.aws.cru.org:4503']
      const options = {
        method: 'GET',
        qs: {
          path: '/content/cru/',
          'p.limit': '-1',
          type: 'cq:Page',
          'p.hits': 'selective',
          'p.properties': 'jcr:path jcr:content/jcr:title jcr:content/jcr:description jcr:content/subtitle jcr:content/image/fileReference'
        },
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': 'Request-Promise'
        },
        json: true
      }
      return new Promise(resolve => {
        request(assign({}, options, {url: `http://${hosts[0]}/bin/querybuilder.json`}))
          .then(resolve, err => {
            request(assign({}, options, {url: `http://${hosts[1]}/bin/querybuilder.json`})).then(resolve, err => {
              throw err
            })
          })
      })
    }

    /**
     * Query list of scores as a Stream
     * @returns {Promise<void>}
     */
    const getScoreStream = async () => {
      const postgresClient = new Client({
        user: process.env.DB_ENV_POSTGRESQL_USER,
        password: process.env.DB_ENV_POSTGRESQL_PASS,
        database: process.env.DB_ENV_POSTGRESQL_DB,
        host: process.env.DB_PORT_5432_TCP_ADDR || 'localhost',
        port: process.env.DB_PORT_5432_TCP_PORT || 5432
      })
      await postgresClient.connect()
      const query = new QueryStream(scoresQuery, [prefixMatch.source])
      const scoreStream = postgresClient.query(query)
      scoreStream.on('end', async () => {
        await postgresClient.end()
      })
      return scoreStream
    }

    /**
     * Adds a header to a stream
     * @param {String} header
     * @returns {module:stream.internal.Transform}
     */
    const addStreamHeader = (header) => {
      let prepended = false
      return new Transform({
        objectMode: true,
        transform: function (data, encoding, callback) {
          if (!prepended) {
            this.push(Buffer.from(header, 'utf8'))
            prepended = true
          }
          callback(null, data)
        }
      })
    }

    const cruOrgJson = await getCruOrgJson()

    const scoreTransform = CSV.transform((record, callback) => {
      const path = record['entity.pageUrl'].replace(prefixMatch, '/content/cru').replace('.html', '')
      if (path.indexOf('.') > -1) {
        callback(null, null)
      } else {
        let page = find(cruOrgJson.hits, {'jcr:path': path})
        if (page === undefined) {
          callback(null, null)
        } else {
          let [language, primarycat, ...subcats] = path.split('/').slice(4, -1)
          if (typeof page['jcr:content'] !== 'undefined') {
            let content = page['jcr:content']
            if (typeof content['jcr:title'] !== 'undefined') {
              record['entity.name'] = content['jcr:title'].trim()
            }
            if (typeof content['jcr:description'] !== 'undefined') {
              record['entity.message'] = content['jcr:description'].replace(new RegExp('[\\r\\n]', 'gi'), ' ').trim()
            } else if (typeof content['subtitle'] !== 'undefined') {
              record['entity.message'] = content['subtitle'].replace(new RegExp('[\\r\\n]', 'gi'), ' ').trim()
            }
            if (typeof content['image'] !== 'undefined' && typeof content['image']['fileReference'] !== 'undefined') {
              record['entity.thumbnailUrl'] = record['entity.pageUrl'].replace(/\.html$/i, '/_jcr_content/image.transform/CruHalf432x243/img.png')
            }
          }
          if (typeof primarycat !== 'undefined') {
            record['entity.primary_category'] = primarycat
          }
          // drop last subcat as it's the article name
          subcats.pop()
          record['entity.language'] = language
          record['entity.sub_categories'] = JSON.stringify(subcats)
          record['entity.categoryId'] = 'article'
          callback(null, record)
        }
      }
    })

    const csvStringify = CSV.stringify({
      delimiter: ',',
      columns: zipObject(feedColumns, map(feedColumns, () => ''))
    })

    const scoreStream = await getScoreStream()
    // scoreStream.pipe(scoreTransform).pipe(csvStringify).pipe(addStreamHeader(csvHeader)).pipe(process.stdout)
    await s3.upload({
      Bucket: 'scale-of-belief-lambda-production', // process.env[''],
      Key: 'cru-org-feed/feed.csv',
      Body: scoreStream.pipe(scoreTransform).pipe(csvStringify).pipe(addStreamHeader(csvHeader)),
      ACL: 'public-read'
    }).promise()
  } catch (err) {
    rollbar.error('cru-org-feed error: ' + err, err)
    throw err
  }
}
