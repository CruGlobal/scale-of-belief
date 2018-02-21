'use strict'

const factory = require('factory-girl').factory
const {User, Event, sequelize, Sequelize} = require('../../models/db/index')
const chance = require('chance').Chance()

factory.define('blank_user', User, {})

factory.extend('blank_user', 'web_user', {
  mcid: () => [chance.natural()],
  network_userid: () => [chance.guid()],
  user_fingerprint: () => [chance.natural()]
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

module.exports = {
  factory: factory,
  sequelize: sequelize,
  Sequelize: Sequelize,
  User: User,
  Event: Event,
  chance: chance
}
