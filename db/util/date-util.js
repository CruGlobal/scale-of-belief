'use strict'

const buildFormattedDate = (date) => {
  return date.getUTCFullYear() + '-' +
  getZeroPaddedValue(date.getUTCMonth() + 1) + '-' +
  getZeroPaddedValue(date.getUTCDate()) + '-' +
  getZeroPaddedValue(date.getUTCHours()) + '-' +
  getZeroPaddedValue(date.getUTCMinutes()) + '-' +
  getZeroPaddedValue(date.getUTCSeconds())
}

const getZeroPaddedValue = (original) => {
  return ('0' + original).slice(-2)
}

module.exports = {
  buildFormattedDate: buildFormattedDate
}
