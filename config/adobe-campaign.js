'use strict'

const AdobeCampaignClient = require('../models/adobe-campaign-client')

module.exports = new AdobeCampaignClient(
  process.env['ACS_URL'],
  process.env['ACS_API_KEY'],
  process.env['ACS_JWT'],
  process.env['ACS_CLIENT_SECRET'])
