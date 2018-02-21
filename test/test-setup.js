'use strict'

const {factory} = require('./factories')

beforeEach(() => {
  // Destroy all created models before each test.
  // This only destroys models created by the factory, It will not delete models created directly with `new Model()`
  return factory.cleanUp()
})
