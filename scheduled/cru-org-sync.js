'use strict'
/* eslint prefer-regex-literals: "off" */

const rollbar = require('../config/rollbar')
const request = require('request-promise-native')
const { assign, chunk, find, forEach, map } = require('lodash')
const prefixMatch = new RegExp('^https?://(www\\.)?cru\\.org(/content/cru)?', 'i')
const scoresQuery = 'SELECT MD5(lower(uri)) AS id, uri AS url, score FROM scores WHERE uri ~* $1'

module.exports.handler = async (lambdaEvent) => {
  const sequelize = require('../config/sequelize')
  const Recommendation = require('../models/recommendation')
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

    return new Promise((resolve, reject) => {
      request(assign({}, options, { url: `http://${hosts[0]}/bin/querybuilder.json` })).then(resolve, () => {
        request(assign({}, options, { url: `http://${hosts[1]}/bin/querybuilder.json` })).then(resolve, reject)
      })
    })
  }

  /**
   * Combine scored url with cruOrg Json
   * @param record
   * @param cruOrgJson
   * @returns {*}
   */
  const scoreTransform = (record, cruOrgJson) => {
    const recommendation = new Recommendation(record)

    const path = recommendation.url.replace(prefixMatch, '/content/cru').replace('.html', '')
    if (path.indexOf('.') === -1) {
      const page = find(cruOrgJson.hits, { 'jcr:path': path })
      if (typeof page !== 'undefined') {
        const [language, ...categories] = path.split('/').slice(4, -1)
        /* istanbul ignore else */
        if (typeof page['jcr:content'] !== 'undefined') {
          const content = page['jcr:content']
          /* istanbul ignore else */
          if (typeof content['jcr:title'] !== 'undefined') {
            recommendation.title = content['jcr:title'].trim()
          }
          if (typeof content['jcr:description'] !== 'undefined') {
            recommendation.message = content['jcr:description'].replace(new RegExp('[\\r\\n]', 'gi'), ' ').trim()
          } else if (typeof content.subtitle !== 'undefined') {
            recommendation.message = content.subtitle.replace(new RegExp('[\\r\\n]', 'gi'), ' ').trim()
          }
          if (typeof content.image !== 'undefined' && typeof content.image.fileReference !== 'undefined') {
            recommendation.thumbnail_url = recommendation.url.replace(/\.html$/i, '/_jcr_content/image.transform/CruHalf432x243/img.png')
          }
        }
        recommendation.categories = categories
        recommendation.language = language
        return recommendation.toJSON()
      }
    }
  }

  const transaction = await sequelize().transaction()
  try {
    // eslint-disable-next-line no-unused-vars
    const [cruOrgJson, scores, _truncate] = await Promise.all([
      getCruOrgJson(),
      sequelize().query(scoresQuery, {
        type: sequelize().QueryTypes.SELECT,
        bind: [prefixMatch.source],
        transaction
      }),
      Recommendation.truncate({ transaction })
    ])
    const recommendations = []
    forEach(scores, (score) => {
      const rec = scoreTransform(score, cruOrgJson)
      if (typeof rec !== 'undefined') {
        recommendations.push(rec)
      }
    })
    await Promise.all(map(chunk(recommendations, 50), (batch) => {
      return Recommendation.bulkCreate(batch, { transaction })
    }))
    await transaction.commit()
    return `Successfully synced ${recommendations.length} recommendations.`
  } catch (err) {
    await transaction.rollback()
    rollbar.error('cru-org-sync error: ' + err, err)
    throw err
  }
}
