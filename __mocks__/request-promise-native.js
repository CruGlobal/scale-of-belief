'use strict'

const requestCalls = {
  get: jest.fn().mockResolvedValue({}),
  post: jest.fn().mockResolvedValue({}),
  put: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({})
}
const requestMock = jest.fn()
requestMock.defaults = jest.fn().mockReturnValue(requestMock)
Object.assign(requestMock, requestCalls)

module.exports = requestMock
