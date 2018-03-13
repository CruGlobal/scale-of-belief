'use strict'

const {Context} = require('../context')

module.exports = (sequelize, DataTypes) => {
  const Api_Key = sequelize.define('Api_Key', {
    system: DataTypes.STRING,
    api_pattern: DataTypes.ARRAY(DataTypes.STRING),
    api_key: DataTypes.UUID,
    contact_email: DataTypes.STRING
  }, {
    tableName: 'api_keys'
  })

  return Api_Key
}
