'use strict'

const path = require('path')
const fs = require('fs')
const fixture = fs.readFileSync(path.join(__fixturesDir, 'context', 'authenticated_web.json'), 'utf-8')
const Context = require('./context')

describe('Context', () => {
  it('should be defined', () => {
    expect(Context).toBeDefined()
    expect(Context.SCHEMA_IDS).toEqual('iglu:org.cru/ids/jsonschema')
    expect(Context.SCHEMA_MOBILE).toEqual('iglu:com.snowplowanalytics.snowplow/mobile_context/jsonschema')
    expect(Context.SCHEMA_WEB_PAGE).toEqual('iglu:com.snowplowanalytics.snowplow/web_page/jsonschema')
    expect(Context.SCHEMA_SCREEN_VIEW).toEqual('iglu:com.snowplowanalytics.snowplow/screen_view/jsonschema')
  })

  it('constructor accepts string', () => {
    const context = new Context('{"sample":{"test":[1,2,3]}}')
    expect(context.context).toEqual({sample: {test: [1, 2, 3]}})
  })

  it('constructor accepts object', () => {
    const context = new Context({sample: {test: [1, 2, 3]}})
    expect(context.context).toEqual({sample: {test: [1, 2, 3]}})
  })

  it('throws a ContextError on invalid json string', () => {
    expect(() => new Context('{hello: 123}')).toThrowError(Context.ContextError)
  })

  it('should not throw an error on an empty string', () => {
    expect(() => new Context('')).not.toThrowError(Context.ContextError)
  })

  describe('hasSchema()', () => {
    it('returns \'true\' if schema exists', () => {
      const context = new Context(fixture)
      expect(context.hasSchema(Context.SCHEMA_IDS)).toEqual(true)
    })
    it('returns \'false\' if schema does not exist', () => {
      const context = new Context(fixture)
      expect(context.hasSchema(Context.SCHEMA_MOBILE)).toEqual(false)
    })
  })

  describe('dataFor()', () => {
    it('returns data if schema exists', () => {
      const context = new Context(fixture)
      expect(context.dataFor(Context.SCHEMA_IDS)).toEqual({
        gr_master_person_id: 'A3B99EB7-F7BF-4443-9C93-09367AB4024B',
        mcid: '1234567890',
        sso_guid: '16C3CE20-396D-4702-8C3F-E5DD0B8AD69E'
      })
    })
    it('returns \'undefined\' if schema data does not exist', () => {
      const context = new Context(fixture)
      expect(context.dataFor(Context.SCHEMA_MOBILE)).toBeUndefined()
    })
  })
})
