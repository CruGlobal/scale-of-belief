'use strict'

const path = require('path')
const {factory} = require('./factories')

global.__fixturesDir = path.join(__dirname, 'fixtures')

beforeEach(() => {
  // Destroy all created models before each test.
  // This only destroys models created by the factory, It will not delete models created directly with `new Model()`
  return factory.cleanUp()
})
