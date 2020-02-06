const mockS3PutObject = jest.fn()
const lambda = require('./uri-scored')

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => ({
      putObject: mockS3PutObject
    }))
  }
})

test('test for putObject in s3', async () => {
  mockS3PutObject.mockImplementation(params => {
    return {
      Body: 'test document'
    }
  })
  expect(await lambda.handler()).toEqual('test document')
})
