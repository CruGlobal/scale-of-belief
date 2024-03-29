/**
 * Modified from https://derikwhittaker.blog/2018/02/20/using-manual-mocks-to-test-the-aws-sdk-with-jest/
 */
const AWS = {}

// This here is to allow/prevent runtime errors if you are using
// AWS.config to do some runtime configuration of the library.
AWS.config = {
  setPromisesDependency: (arg) => {},
  update: (arg) => {}
}

AWS.S3 = function () {

}

// Because I care about using the S3 service's which are part of the SDK
// I need to setup the correct identifier.
AWS.S3.prototype = {
  ...AWS.S3.prototype,

  upload (params) {
    // this value is 0 by default in the tests
    if (params.Body.bytesRead === 0) {
      params.Body.bytesRead = 1
    } else if (params.Body.bytesRead === -1) {
      params.Body.bytesRead = 0
    }

    return {
      promise: () => Promise.resolve()
    }
  }
}

AWS.SNS = function () {}
AWS.SNS.prototype.publish = jest.fn().mockImplementation((params, callback) => {
  if (params.Message.indexOf('http://fail.com/') !== -1) {
    callback(new Error('Failed to send SNS message'))
  } else {
    callback(null, 1)
  }
})

// Export my AWS function so it can be referenced via requires
module.exports = AWS
