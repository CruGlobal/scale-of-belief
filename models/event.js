'use strict'

const {
  forEach,
  includes,
  isEmpty,
  mapValues,
  omit,
  startsWith
} = require('lodash')
const Context = require('./context')
const Score = require('./score')
const DerivedEvent = require('./derived-event')
const { DataTypes, Sequelize } = require('sequelize')
const sequelize = require('../config/sequelize')
const Url = require('url')
const logger = require('../config/logger')
// See https://github.com/snowplow/snowplow/wiki/canonical-event-model
const Fields = {
  app_id: 0,
  platform: 1,
  etl_tstamp: 2,
  collector_tstamp: 3,
  dvce_created_tstamp: 4,
  event: 5,
  event_id: 6,
  txn_id: 7,
  name_tracker: 8,
  v_tracker: 9,
  v_collector: 10,
  v_etl: 11,
  user_id: 12,
  user_ipaddress: 13,
  user_fingerprint: 14,
  domain_userid: 15,
  domain_sessionidx: 16,
  network_userid: 17,
  geo_country: 18,
  geo_region: 19,
  geo_city: 20,
  geo_zipcode: 21,
  geo_latitude: 22,
  geo_longitude: 23,
  geo_region_name: 24,
  ip_isp: 25,
  ip_organization: 26,
  ip_domain: 27,
  ip_netspeed: 28,
  page_url: 29,
  page_title: 30,
  page_referrer: 31,
  page_urlscheme: 32,
  page_urlhost: 33,
  page_urlport: 34,
  page_urlpath: 35,
  page_urlquery: 36,
  page_urlfragment: 37,
  refr_urlscheme: 38,
  refr_urlhost: 39,
  refr_urlport: 40,
  refr_urlpath: 41,
  refr_urlquery: 42,
  refr_urlfragment: 43,
  refr_medium: 44,
  refr_source: 45,
  refr_term: 46,
  mkt_medium: 47,
  mkt_source: 48,
  mkt_term: 49,
  mkt_content: 50,
  mkt_campaign: 51,
  contexts: 52,
  se_category: 53,
  se_action: 54,
  se_label: 55,
  se_property: 56,
  se_value: 57,
  unstruct_event: 58,
  tr_orderid: 59,
  tr_affiliation: 60,
  tr_total: 61,
  tr_tax: 62,
  tr_shipping: 63,
  tr_city: 64,
  tr_state: 65,
  tr_country: 66,
  ti_orderid: 67,
  ti_sku: 68,
  ti_name: 69,
  ti_category: 70,
  ti_price: 71,
  ti_quantity: 72,
  pp_xoffset_min: 73,
  pp_xoffset_max: 74,
  pp_yoffset_min: 75,
  pp_yoffset_max: 76,
  useragent: 77,
  br_name: 78,
  br_family: 79,
  br_version: 80,
  br_type: 81,
  br_renderengine: 82,
  br_lang: 83,
  br_features_pdf: 84,
  br_features_flash: 85,
  br_features_java: 86,
  br_features_director: 87,
  br_features_quicktime: 88,
  br_features_realplayer: 89,
  br_features_windowsmedia: 90,
  br_features_gears: 91,
  br_features_silverlight: 92,
  br_cookies: 93,
  br_colordepth: 94,
  br_viewwidth: 95,
  br_viewheight: 96,
  os_name: 97,
  os_family: 98,
  os_manufacturer: 99,
  os_timezone: 100,
  dvce_type: 101,
  dvce_ismobile: 102,
  dvce_screenwidth: 103,
  dvce_screenheight: 104,
  doc_charset: 105,
  doc_width: 106,
  doc_height: 107,
  tr_currency: 108,
  tr_total_base: 109,
  tr_tax_base: 110,
  tr_shipping_base: 111,
  ti_currency: 112,
  ti_price_base: 113,
  base_currency: 114,
  geo_timezone: 115,
  mkt_clickid: 116,
  mkt_network: 117,
  etl_tags: 118,
  dvce_sent_tstamp: 119,
  refr_domain_userid: 120,
  refr_dvce_tstamp: 121,
  derived_contexts: 122,
  domain_sessionid: 123,
  derived_tstamp: 124,
  event_vendor: 125,
  event_name: 126,
  event_format: 127,
  event_version: 128,
  event_fingerprint: 129,
  true_tstamp: 130
}

const Event = sequelize().define('Event', {
  event_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  user_id: DataTypes.BIGINT,
  type: DataTypes.STRING(64),
  web_id: DataTypes.UUID,
  uri: {
    type: DataTypes.STRING(2048),
    get () {
      const value = this.getDataValue('uri')
      if (value) {
        return value.toLowerCase()
      }
      return value
    },
    set (val) {
      if (val) {
        this.setDataValue('uri', val.toLowerCase())
      } else {
        this.setDataValue('uri', val)
      }
    }
  },
  derived_tstamp: 'TIMESTAMP(3)',
  collector_tstamp: 'TIMESTAMP(3)'
}, {
  tableName: 'events',
  underscored: true
})

Event.Fields = Fields

// prototype Fields on Event instances
forEach(Fields, (index, key) => {
  // Skip named Event columns that collide with Field names
  if (includes(['event_id', 'user_id', 'derived_tstamp', 'collector_tstamp'], key)) {
    return
  }
  Event.prototype.__defineGetter__(key, function () {
    const value = (this.decodedFields || {})[index]
    // Parse JSON context
    if (typeof value !== 'undefined' && includes(['contexts', 'derived_contexts', 'unstruct_event'], key)) {
      return new Context(value)
    }
    return value
  })
})

Event.fromRecord = (base64Data) => {
  let data
  try {
    data = Buffer.from(base64Data, 'base64').toString('utf8')
  } catch (e) {
    throw new InvalidEventError('Malformed kinesis event: ' + e.message)
  }
  const decoded = data.split('\t')
  // Throw an error if we have less fields than we should. Snowplow can add more, but it doesn't remove any existing.
  if (decoded.length < Object.keys(Fields).length) {
    throw new InvalidEventError(`Kinesis event is missing fields (needs: ${Object.keys(Fields).length}, has: ${decoded.length})`)
  }
  const event = new Event()
  event.event_id = decoded[Fields.event_id]
  // Use event_name for the event type (page_view, page_ping, link_click, screen_view...)
  event.type = decoded[Fields.event_name]
  event.collector_tstamp = decoded[Fields.collector_tstamp]
  event.derived_tstamp = decoded[Fields.derived_tstamp]
  event.decodedFields = decoded

  // Log event_id with encoded data. Will allow re-creating kinesis stream locally for debugging
  logger.debug(JSON.stringify({ event_id: event.event_id, kinesis: { data: base64Data } }))
  // Log mapped fields for easier visual debugging
  logger.info(JSON.stringify(mapValues(Fields, value => decoded[value])))

  // Will throw errors if event is not a valid DerivedEvent
  DerivedEvent.ensureValid(event)

  // Set web_id if present
  const contexts = event.contexts
  if (contexts && contexts.hasSchema(Context.SCHEMA_WEB_PAGE)) {
    const webData = contexts.dataFor(Context.SCHEMA_WEB_PAGE)
    event.web_id = webData.id
  }

  event.uri = uriFromEvent(event)
  return event
}

/**
 * @param {Event} event
 * @returns {String|NULL}
 */
function uriFromEvent (event) {
  const contexts = event.contexts
  let format
  // Use content-scoring.uri if present
  if (contexts && contexts.hasSchema(Context.SCHEMA_CONTENT_SCORING)) {
    try {
      const contentScoring = contexts.dataFor(Context.SCHEMA_CONTENT_SCORING)
      const parsed = new Url.URL(contentScoring.uri)
      format = {
        protocol: parsed.protocol,
        slashes: true,
        hostname: parsed.hostname,
        pathname: parsed.pathname
      }
    } catch (e) {
      // TypeError - contentScoring.uri was not a string
      /* istanbul ignore next */
      return null
    }
  } else if (event.platform === 'mob') {
    // Fallback for mobile apps that don't use the content-scoring context
    const unstruct = event.unstruct_event
    let pathname = ''
    /* istanbul ignore else */
    if (unstruct && unstruct.hasSchema(Context.SCHEMA_SCREEN_VIEW)) {
      const data = unstruct.dataFor(Context.SCHEMA_SCREEN_VIEW)
      pathname = data.name.replace(/[^a-zA-Z0-9-_]/g, '')
    }
    format = {
      protocol: event.app_id,
      slashes: true,
      hostname: event.event_name,
      pathname
    }
  } else if (event.page_url) {
    try {
      const parsed = new Url.URL(event.page_url)
      format = {
        protocol: parsed.protocol,
        slashes: true,
        hostname: parsed.hostname,
        pathname: parsed.pathname
      }
    } catch (e) {
      // TypeError - page_url was not a string, will probably never hit this since base64 decode always produces strings
      /* istanbul ignore next */
      return null
    }
  }
  if (!isEmpty(format)) {
    const url = Url.format(format)
    if (startsWith(url, '///')) {
      return null
    }
    return url
  }
  return null
}

Event.prototype.replace = function () {
  const event = this
  // Save the event, if no errors result, this is the end of the replace() method
  return this
    .save()
    // Catch any errors with save()
    .catch(error => {
      if ((error instanceof Sequelize.UniqueConstraintError) && error.errors[0].message === 'event_id must be unique') {
        // Update by event_id if save() resulted in unique constraint by event_id
        return Event
        // Update every field except id and event_id, these are unique and don't need to be updated
          .update(omit(event.dataValues, ['id', 'event_id']), {
            where: { event_id: event.event_id },
            returning: true
          })
          .then(results => {
            // results is [affectedCount, affectedRows], return the first affectedRow
            return results[1][0]
          })
      }
      // Re-throw error if we didn't rescue it
      throw error
    })
}

Event.prototype.isScored = function () {
  if (typeof this.uri === 'undefined' || this.uri === null) {
    return Promise.resolve(false)
  }
  return Score.findOne({ where: { uri: this.uri } }).then(score => score !== null)
}

class InvalidEventError extends Error {}

Event.InvalidEventError = InvalidEventError

module.exports = Event
