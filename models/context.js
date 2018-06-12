'use strict'

const {castArray, isEmpty, find, startsWith} = require('lodash')

class Context {
  static get SCHEMA_WEB_PAGE () { return 'iglu:com.snowplowanalytics.snowplow/web_page/jsonschema' }

  static get SCHEMA_IDS () { return 'iglu:org.cru/ids/jsonschema' }

  static get SCHEMA_MOBILE () { return 'iglu:com.snowplowanalytics.snowplow/mobile_context/jsonschema' }

  static get SCHEMA_SCREEN_VIEW () { return 'iglu:com.snowplowanalytics.snowplow/screen_view/jsonschema' }

  constructor (context) {
    try {
      if (typeof context === 'string') {
        this.context = isEmpty(context) ? {} : JSON.parse(context)
      } else {
        this.context = context
      }
    } catch (error) {
      throw new ContextError(error.message + ': ' + context)
    }
  }

  hasSchema (schema) {
    return typeof this.dataFor(schema) !== 'undefined'
  }

  dataFor (schema) {
    if (isEmpty(this.context)) {
      return undefined
    }
    const found = find(castArray(this.context.data), item => startsWith(item.schema, schema))
    return typeof found !== 'undefined' ? found.data : found
  }
}

class ContextError extends Error {}

Context.ContextError = ContextError

module.exports = Context
