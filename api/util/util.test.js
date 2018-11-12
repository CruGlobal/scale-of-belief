'use strict'

const utils = require('./util.js')

describe('sanitizeUri', () => {
  it('returns uri', () => {
    const tested = 'http://google.com/abc#anchor?param=value'
    const result = utils.sanitizeUri(tested)
    expect(result).toEqual('http://google.com/abc')
  })
  it('returns uri when with quotes', () => {
    const tested = '"http://google.com/abc#anchor?param=value"'
    const result = utils.sanitizeUri(tested)
    expect(result).toEqual('http://google.com/abc')
  })
})
