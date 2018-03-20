'use strict'

const {find, startsWith} = require('lodash')

class Context {
  static get SCHEMA_WEB_PAGE () { return 'iglu:com.snowplowanalytics.snowplow/web_page/jsonschema' }

  static get SCHEMA_SCORES () { return 'iglu:org.cru/contentscores/jsonschema' }

  static get SCHEMA_IDS () { return 'iglu:org.cru/ids/jsonschema' }

  static get SCHEMA_MOBILE () { return 'iglu:com.snowplowanalytics.snowplow/mobile_context/jsonschema' }

  constructor (context) {
    this.context = typeof context === 'string' ? JSON.parse(context) : context
  }

  hasSchema (schema) {
    return typeof this.dataFor(schema) !== 'undefined'
  }

  dataFor (schema) {
    const found = find(this.context.data, item => startsWith(item.schema, schema))
    return typeof found !== 'undefined' ? found.data : found
  }
}

module.exports = Context
