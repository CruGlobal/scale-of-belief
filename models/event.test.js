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
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'valid-page_url.txt'), 'utf-8')
      const event = Event.fromRecord({kinesis: {data: data}})
      expect(event).toBeInstanceOf(Event)
      expect(event.event_id).toEqual('508e441b-8e9b-40f3-a83a-605df8b141c8')
      expect(event.uri).toEqual('https://stage.cru.org/us/en/how-to-know-god/would-you-like-to-know-god-personally/decision.html')
    })

    xit('should parse event from ios app', () => {})
    xit('should parse event from android app', () => {})
    xit('should parse event missing page_url', () => {})
    xit('should parse event with malformed page_url', () => {})
  })
})
