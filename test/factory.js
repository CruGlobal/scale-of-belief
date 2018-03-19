'use strict'

const factory = require('factory-girl').factory
const User = require('../models/user')
const Event = require('../models/event')
const Score = require('../models/score')
const chance = require('chance').Chance()

factory.define('blank_user', User, {})

factory.extend('blank_user', 'web_user', {
  mcid: () => [chance.natural().toString()],
  network_userid: () => [chance.guid()],
  user_fingerprint: () => [chance.natural().toString()]
})

factory.extend('blank_user', 'android_user', {
  android_idfa: () => [chance.android_id()]
})

factory.extend('blank_user', 'apple_user', {
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

factory.define('event', Event, {})

factory.define('blank_score', Score, {})

factory.extend('blank_score', 'basic_score', {
  uri: 'http://some.uri.com',
  unaware: 1,
  curious: 1,
  follower: 1,
  guide: 1,
  confidence: 0
})

module.exports = factory
