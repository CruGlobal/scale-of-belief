'use strict'

const AemClient = require('../models/aem-client')

module.exports = new AemClient(process.env['AEM_URL'], process.env['AEM_USERNAME'], process.env['AEM_PASSWORD'])
