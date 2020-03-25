const mockS3PutObject = jest.fn()

AWS.S3.prototype = {
  putObject: jest.fn()
}

test('test for putObject in s3', async () => {
  AWS.S3.putObject.mockImplementation(params => {
    return {
      Body: 'success'
    }
  })
  expect(AWS.S3.putObject).toHaveBeenCalledWith({aaa:123})
})
