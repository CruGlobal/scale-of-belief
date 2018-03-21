'use strict'

const factory = require('factory-girl').factory
const User = require('../models/user')
const Event = require('../models/event')
const Score = require('../models/score')
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

factory.define('blank_score', Score, {})

factory.extend('blank_score', 'existing_score', {
  uri: 'http://some.uri.com',
  unaware: 1,
  curious: 1,
  follower: 1,
  guide: 1,
  confidence: 0
})

factory.extend('blank_score', 'created_score', {
  uri: 'http://somewhere.com/1',
  unaware: 1,
  curious: 5,
  follower: 3,
  guide: 1,
  confidence: 98
})

factory.extend('existing_score', 'updated_score', {
  unaware: 2,
  curious: 2,
  follower: 2,
  guide: 2,
  confidence: 50
})

module.exports = factory
