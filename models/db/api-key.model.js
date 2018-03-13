'use strict'

module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define('ApiKey', {
    system: DataTypes.STRING,
    api_pattern: DataTypes.ARRAY(DataTypes.STRING),
    api_key: DataTypes.UUID,
    contact_email: DataTypes.STRING
  }, {
    tableName: 'api_keys'
  })

  return ApiKey
}
