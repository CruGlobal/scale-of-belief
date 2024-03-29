'use strict'

const Event = require('./event')
const DerivedEvent = require('./derived-event')
const { forEach } = require('lodash')
const path = require('path')
const fs = require('fs')
const factory = require('../test/factory')
const chance = require('chance').Chance()

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
      const record = 'Blah Blah Blah'
      expect(() => Event.fromRecord(record)).toThrowError(Event.InvalidEventError)
    })

    it('should throw InvalidEventError for event missing fields', () => {
      const record = 'Blah Blah Blah'
      expect(() => Event.fromRecord(record)).toThrowError(Event.InvalidEventError)
    })

    it('should throw InvalidDerivedEventError for an event generated by a robot/spider (br_family)', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'robot-family.txt'), 'utf-8')
      expect(() => Event.fromRecord(data)).toThrowError(DerivedEvent.InvalidDerivedEventError)
    })

    it('should throw InvalidDerivedEventError for an event generated by a robot/spider (useragent)', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'robot-ua.txt'), 'utf-8')
      expect(() => Event.fromRecord(data)).toThrowError(DerivedEvent.InvalidDerivedEventError)
    })

    it('should throw InvalidDerivedEventError for an event with a bad app_id (empty)', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'app-id-empty.txt'), 'utf-8')
      expect(() => Event.fromRecord(data)).toThrowError(DerivedEvent.InvalidDerivedEventError)
    })

    it('should throw InvalidDerivedEventError for an event with a bad app_id (-web)', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'app-id-web.txt'), 'utf-8')
      expect(() => Event.fromRecord(data)).toThrowError(DerivedEvent.InvalidDerivedEventError)
    })

    it('should throw InvalidDerivedEventError for an event with a bad app_id (localhost)', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'app-id-localhost.txt'), 'utf-8')
      expect(() => Event.fromRecord(data)).toThrowError(DerivedEvent.InvalidDerivedEventError)
    })

    it('should throw InvalidDerivedEventError for an event with a bad page_urlhost (stage.cru.org)', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'page-urlhost.txt'), 'utf-8')
      expect(() => Event.fromRecord(data)).toThrowError(DerivedEvent.InvalidDerivedEventError)
    })

    it('should parse event with valid page_url', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'web-valid.txt'), 'utf-8')
      const event = Event.fromRecord(data)
      expect(event).toBeInstanceOf(Event)
      expect(event.event_id).toEqual('508e441b-8e9b-40f3-a83a-605df8b141c8')
      expect(event.uri).toEqual('https://www.cru.org/us/en/how-to-know-god/would-you-like-to-know-god-personally/decision.html')
      expect(event.type).toEqual('page_view')
      expect(event.web_id).toEqual('afe2274d-7731-4e2a-9813-3e702ad160a0')
    })

    // TODO: Need iOS test
    xit('should parse event from ios app', () => {})

    it('should parse event from android app', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'android.txt'), 'utf-8')
      const event = Event.fromRecord(data)
      expect(event).toBeInstanceOf(Event)
      expect(event.event_id).toEqual('6c5838d3-8e5d-4687-9459-111a43a60839')
      expect(event.uri).toEqual('godtools://screen_view/toolinfo')
      expect(event.type).toEqual('screen_view')
      expect(event.web_id).not.toBeDefined()
    })

    it('should parse event missing page_url', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'web-missing.txt'), 'utf-8')
      const event = Event.fromRecord(data)
      expect(event).toBeInstanceOf(Event)
      expect(event.event_id).toEqual('dce78971-1132-4abb-aa40-81b06285ce45')
      expect(event.uri).toEqual(null)
      expect(event.type).toEqual('link_click')
      expect(event.web_id).toEqual('b70260cb-2b5d-4ed6-9ca5-4755917b79ae')
    })

    it('should parse event with malformed page_url', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'web-invalid.txt'), 'utf-8')
      const event = Event.fromRecord(data)
      expect(event).toBeInstanceOf(Event)
      expect(event.event_id).toEqual('97f3cead-5a3a-455d-9589-4758039f1599')
      expect(event.uri).toEqual(null)
      expect(event.type).toEqual('page_view')
      expect(event.web_id).toEqual('941f0265-efc6-4d5c-8955-cd8bebd416a6')
    })

    it('should parse event from server', () => {
      const data = fs.readFileSync(path.join(__fixturesDir, 'event', 'server.txt'), 'utf-8')
      const event = Event.fromRecord(data)
      expect(event).toBeInstanceOf(Event)
      expect(event.event_id).toEqual('dd94ffab-e35a-4863-81fb-22102bc250a6')
      expect(event.uri).toEqual('survey://bulk-import/self-selected-1')
      expect(event.type).toEqual('event')
      expect(event.web_id).not.toBeDefined()
    })
  })

  describe('prototype.replace()', () => {
    describe('event does not exist', () => {
      let event
      beforeEach(() => {
        return factory.build('web_event', { user_id: 123 }).then(webEvent => { event = webEvent })
      })

      it('should save() the event', () => {
        return event.replace().then(saved => {
          expect(saved.id).toBeDefined()
          expect(event).toEqual(saved)
        })
      })
    })

    describe('event already exists', () => {
      let event1
      let event2
      beforeEach(() => {
        const eventId = chance.guid()
        return Promise.all([
          factory.create('web_event', { event_id: eventId, user_id: 123 }).then(webUser => { event1 = webUser }),
          factory.build('web_event', { event_id: eventId, user_id: 123 }).then(webUser => { event2 = webUser })
        ])
      })

      it('should update() the event', () => {
        const spy = jest.spyOn(Event, 'update')

        return event2.replace().then(saved => {
          expect(saved.id).toEqual(event1.id)
          expect(spy).toHaveBeenCalled()
        })
      })
    })

    describe('event causes error', () => {
      let event
      beforeEach(() => {
        return factory.build('web_event', { user_id: 123 }).then(webEvent => { event = webEvent })
      })

      it('should throw the error', () => {
        jest.spyOn(event, 'save').mockImplementation(() => Promise.reject(new Error('any reason')))

        return expect(event.replace()).rejects.toThrow('any reason')
      })
    })
  })

  describe('prototype.isScored()', () => {
    describe('event without a uri', () => {
      let event
      beforeEach(() => {
        return factory.build('web_event').then(webEvent => { event = webEvent })
      })

      it('should resolve \'false\'', () => {
        event.isScored().then(result => {
          expect(result).toBe(false)
        })
      })
    })

    describe('event with unscored uri', () => {
      let event
      beforeEach(() => {
        return factory.build('web_event', { uri: 'sample://score' }).then(webEvent => { event = webEvent })
      })

      it('should resolve \'false\'', () => {
        event.isScored().then(result => {
          expect(result).toBe(false)
        })
      })
    })

    describe('event with scored uri', () => {
      let event
      beforeEach(() => {
        return factory.build('web_event', { uri: 'sample://score' })
          .then(webEvent => { event = webEvent })
          .then(() => factory.create('existing_score', { uri: 'sample://score' }))
      })

      it('should resolve \'true\'', () => {
        event.isScored().then(result => {
          expect(result).toBe(true)
        })
      })
    })
  })
})
