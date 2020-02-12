const mockS3PutObject = jest.fn()

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => ({
      putObject: mockS3PutObject
    }))
  }
})

test('test for putObject in s3', async () => {
  let params = {}
  mockS3PutObject.mockImplementation(params => {
    return {
      Body: 'success'
    }
  })
  expect(jest.mock.putObject).toHaveBeenCalledWith(params)
})
