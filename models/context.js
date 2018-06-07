'use strict'

const {castArray, find, startsWith} = require('lodash')

class Context {
  static get SCHEMA_WEB_PAGE () { return 'iglu:com.snowplowanalytics.snowplow/web_page/jsonschema' }

  static get SCHEMA_IDS () { return 'iglu:org.cru/ids/jsonschema' }

  static get SCHEMA_MOBILE () { return 'iglu:com.snowplowanalytics.snowplow/mobile_context/jsonschema' }

  static get SCHEMA_SCREEN_VIEW () { return 'iglu:com.snowplowanalytics.snowplow/screen_view/jsonschema' }

  constructor (context) {
    this.context = typeof context === 'string' ? JSON.parse(context) : context
  }

  hasSchema (schema) {
    return typeof this.dataFor(schema) !== 'undefined'
  }

  dataFor (schema) {
    const found = find(castArray(this.context.data), item => startsWith(item.schema, schema))
    return typeof found !== 'undefined' ? found.data : found
  }
}

module.exports = Context
