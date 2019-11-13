'use strict'

const lambda = require('./uri-scored')
const requestMock = require('request-promise-native')
const {Client} = require('pg')
const AWS = require('aws-sdk')
const s3bucket = new AWS.S3({apiVersion: '2006-03-01'})

jest.mock('pg', () => ({
    Client: jest.fn()
  }))

describe('uri-scored', () => {
  it('Should be defined', () => {
    expect(lambda).toBeDefined()
  })

  describe('success in copy to s3', () => {
    it('should succeed', async () => {
      await expect(lambda.handler()).resolves.not.toBeNull()
    })
  })
})
