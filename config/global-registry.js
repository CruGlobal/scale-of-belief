'use strict'

const GlobalRegistryClient = require('../models/global-registry-client')

module.exports = new GlobalRegistryClient(process.env['GLOBAL_REGISTRY_URL'], process.env['GLOBAL_REGISTRY_TOKEN'])
