'use strict'

const path = require('path')
const fs = require('fs')
const fixture = fs.readFileSync(path.join(__fixturesDir, 'context.json'), 'utf-8')
const {Context} = require('./context')

describe('Context', () => {
  it('should be defined', () => {
    expect(Context).toBeDefined()
    expect(Context.SCHEMA_IDS).toEqual('iglu:org.cru/ids/jsonschema')
    expect(Context.SCHEMA_MOBILE).toEqual('iglu:com.snowplowanalytics.snowplow/mobile_context/jsonschema')
    expect(Context.SCHEMA_SCORES).toEqual('iglu:org.cru/contentscores/jsonschema')
    expect(Context.SCHEMA_WEB_PAGE).toEqual('iglu:com.snowplowanalytics.snowplow/web_page/jsonschema')
  })

  it('constructor accepts string', () => {
    const context = new Context('{"sample":{"test":[1,2,3]}}')
    expect(context.context).toEqual({sample: {test: [1, 2, 3]}})
  })

  it('constructor accepts object', () => {
    const context = new Context({sample: {test: [1, 2, 3]}})
    expect(context.context).toEqual({sample: {test: [1, 2, 3]}})
  })

  describe('hasSchema()', () => {
    it('returns \'true\' if schema exists', () => {
      const context = new Context(fixture)
      expect(context.hasSchema(Context.SCHEMA_SCORES)).toEqual(true)
    })
    it('returns \'false\' if schema does not exist', () => {
      const context = new Context(fixture)
      expect(context.hasSchema(Context.SCHEMA_MOBILE)).toEqual(false)
    })
  })

  describe('dataFor()', () => {
    it('returns data if schema exists', () => {
      const context = new Context(fixture)
      expect(context.dataFor(Context.SCHEMA_SCORES)).toEqual({
        confidence: 0.01,
        curious: 1,
        follower: 1,
        guide: 1,
        unaware: 1
      })
    })
    it('returns \'undefined\' if schema data does not exist', () => {
      const context = new Context(fixture)
      expect(context.dataFor(Context.SCHEMA_MOBILE)).toBeUndefined()
    })
  })
})
