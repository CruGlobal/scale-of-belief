'use strict'

const factory = require('factory-girl').factory
const User = require('../models/user')
const Event = require('../models/event')
const chance = require('chance').Chance()
const path = require('path')
const fs = require('fs')

factory.define('user', User, {})

factory.extend('user', 'web_user', {
  mcid: () => [chance.natural().toString()],
  network_userid: () => [chance.guid()],
  user_fingerprint: () => [chance.natural().toString()]
})

factory.extend('user', 'android_user', {
  android_idfa: () => [chance.android_id()]
})

factory.extend('user', 'apple_user', {
  apple_idfa: () => [chance.apple_token()]
})

factory.extend('web_user', 'authenticated_web_user', {
  gr_master_person_id: () => [chance.guid()],
  sso_guid: () => [chance.guid()]
})

factory.extend('android_user', 'authenticated_android_user', {
  gr_master_person_id: () => [chance.guid()],
  sso_guid: () => [chance.guid()]
})

factory.extend('apple_user', 'authenticated_apple_user', {
  gr_master_person_id: () => [chance.guid()],
  sso_guid: () => [chance.guid()]
})

factory.define('event', Event, {
  event_id: () => chance.guid()
})

factory.extend('event', 'web_event', {}, {
  afterBuild: (model) => {
    model.decodedFields = {
      [Event.Fields['domain_userid']]: chance.natural().toString(),
      [Event.Fields['user_fingerprint']]: chance.natural().toString(),
      [Event.Fields['network_userid']]: chance.guid(),
      [Event.Fields['contexts']]: fs.readFileSync(path.join(__fixturesDir, 'context', 'web.json'), 'utf-8')
    }
    return model
  }
})

factory.extend('event', 'authenticated_web_event', {}, {
  afterBuild: (model) => {
    model.decodedFields = {
      [Event.Fields['domain_userid']]: chance.natural().toString(),
      [Event.Fields['user_fingerprint']]: chance.natural().toString(),
      [Event.Fields['network_userid']]: chance.guid(),
      [Event.Fields['contexts']]: fs.readFileSync(path.join(__fixturesDir, 'context', 'authenticated_web.json'), 'utf-8')
    }
    return model
  }
})

factory.extend('event', 'android_event', {}, {
  afterBuild: (model) => {
    model.decodedFields = {
      [Event.Fields['contexts']]: fs.readFileSync(path.join(__fixturesDir, 'context', 'android.json'), 'utf-8')
    }
    return model
  }
})

factory.extend('event', 'authenticated_android_event', {}, {
  afterBuild: (model) => {
    model.decodedFields = {
      [Event.Fields['contexts']]: fs.readFileSync(path.join(__fixturesDir, 'context', 'authenticated_android.json'), 'utf-8')
    }
    return model
  }
})

factory.extend('event', 'authenticated_apple_event', {}, {
  afterBuild: (model) => {
    model.decodedFields = {
      [Event.Fields['contexts']]: fs.readFileSync(path.join(__fixturesDir, 'context', 'authenticated_apple.json'), 'utf-8')
    }
    return model
  }
})

module.exports = factory
