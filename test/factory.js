'use strict'

const factory = require('factory-girl').factory
const User = require('../models/user')
const Event = require('../models/event')
const Score = require('../models/score')
const Unscored = require('../models/unscored')
const ApiUser = require('../models/api-user')
const Recommendation = require('../models/recommendation')
const chance = require('chance').Chance()
const path = require('path')
const fs = require('fs')

factory.define('user', User, {})

factory.extend('user', 'web_user', {
  mcid: () => [chance.natural().toString()],
  network_userid: () => [chance.guid()],
  domain_userid: () => [chance.natural().toString()],
  user_fingerprint: () => [chance.natural().toString()]
})

factory.extend('user', 'android_user', {
  device_idfa: () => [chance.android_id()]
})

factory.extend('user', 'apple_user', {
  device_idfa: () => [chance.apple_token()]
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
      [Event.Fields['platform']]: 'web',
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
      [Event.Fields['platform']]: 'web',
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
      [Event.Fields['platform']]: 'mob',
      [Event.Fields['contexts']]: fs.readFileSync(path.join(__fixturesDir, 'context', 'android.json'), 'utf-8')
    }
    return model
  }
})

factory.extend('event', 'authenticated_android_event', {}, {
  afterBuild: (model) => {
    model.decodedFields = {
      [Event.Fields['platform']]: 'mob',
      [Event.Fields['contexts']]: fs.readFileSync(path.join(__fixturesDir, 'context', 'authenticated_android.json'), 'utf-8')
    }
    return model
  }
})

factory.extend('event', 'authenticated_apple_event', {}, {
  afterBuild: (model) => {
    model.decodedFields = {
      [Event.Fields['platform']]: 'mob',
      [Event.Fields['contexts']]: fs.readFileSync(path.join(__fixturesDir, 'context', 'authenticated_apple.json'), 'utf-8')
    }
    return model
  }
})

factory.define('blank_score', Score, {})

factory.extend('blank_score', 'existing_score', {
  uri: 'http://some.uri.com',
  score: 5,
  weight: 3,
  revision: 1
})

factory.extend('blank_score', 'created_score', {
  uri: 'http://somewhere.com/1',
  score: 1,
  weight: 6,
  revision: 1
})

factory.extend('existing_score', 'updated_score', {
  score: 2,
  weight: 1,
  revision: 2
})

factory.define('api_user', ApiUser, {})

const userGuid = chance.guid()
factory.extend('api_user', 'existing_user', {
  guid: userGuid,
  api_pattern: ['http://some.uri.com'],
  contact_email: 'steve.test@cru.org',
  type: 'super'
})

factory.extend('api_user', 'updated_user', {
  guid: userGuid,
  api_pattern: ['.*'],
  contact_email: 'bob.test@cru.org',
  type: null
})

factory.extend('api_user', 'created_user', {
  guid: chance.guid(),
  api_pattern: ['.*'],
  contact_email: 'frank.test@cru.org',
  type: null
})

factory.define('unscored', Unscored, {
  uri: 'http://some.uri.com',
  last_refreshed: new Date()
})

factory.define('recommendation', Recommendation, {})


factory.define('uri_s3', 's3_result', {
  Etag: '"2530ed87d5aac1f605733610ad21b429"'
})


module.exports = factory
