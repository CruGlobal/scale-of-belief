'use strict'

const Event = require('./event')
const {forEach} = require('lodash')
const path = require('path')
const fs = require('fs')

describe('Event', () => {
  it('should be defined', () => {
    expect(Event).toBeDefined()
  })

  it('should have getters for every Field', () => {
    const event = new Event()
    expect.assertions(Event.Fields.length)
    forEach(Event.Fields, (value, key) => {
      expect(event).toHaveProperty(key)
    })
  })

  describe('Event.fromRecord()', () => {
    it('should throw InvalidEventError for malformed event', () => {
      let record = {other: {data: 'Blah Blah Blah'}}
      expect(() => Event.fromRecord(record)).toThrowError(Event.InvalidEventError)
    })

    it('should throw InvalidEventError for event missing fields', () => {
      let record = {kinesis: {data: 'Blah Blah Blah'}}
      expect(() => Event.fromRecord(record)).toThrowError(Event.InvalidEventError)
    })

    it('should parse event with valid page_url', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'web-valid.txt'), 'utf-8')
      const event = Event.fromRecord({kinesis: {data: data}})
      expect(event).toBeInstanceOf(Event)
      expect(event.event_id).toEqual('508e441b-8e9b-40f3-a83a-605df8b141c8')
      expect(event.uri).toEqual('https://stage.cru.org/us/en/how-to-know-god/would-you-like-to-know-god-personally/decision.html')
    })

    // TODO: Need iOS test
    xit('should parse event from ios app', () => {})

    it('should parse event from android app', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'android.txt'), 'utf-8')
      const event = Event.fromRecord({kinesis: {data: data}})
      expect(event).toBeInstanceOf(Event)
      expect(event.event_id).toEqual('6c5838d3-8e5d-4687-9459-111a43a60839')
      expect(event.uri).toEqual('mobile://godtools/screen_view/toolinfo')
    })

    it('should parse event missing page_url', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'web-missing.txt'), 'utf-8')
      const event = Event.fromRecord({kinesis: {data: data}})
      expect(event).toBeInstanceOf(Event)
      expect(event.event_id).toEqual('dce78971-1132-4abb-aa40-81b06285ce45')
      expect(event.uri).toEqual(null)
    })

    it('should parse event with malformed page_url', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'web-invalid.txt'), 'utf-8')
      const event = Event.fromRecord({kinesis: {data: data}})
      expect(event).toBeInstanceOf(Event)
      expect(event.event_id).toEqual('97f3cead-5a3a-455d-9589-4758039f1599')
      expect(event.uri).toEqual(null)
    })
  })
})
