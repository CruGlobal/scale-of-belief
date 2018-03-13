'use strict'

module.exports = (sequelize, DataTypes) => {
  const Score = sequelize.define('Score', {
    uri: DataTypes.STRING,
    unaware: DataTypes.INTEGER,
    curious: DataTypes.INTEGER,
    follower: DataTypes.INTEGER,
    guide: DataTypes.INTEGER,
    confidence: DataTypes.DOUBLE
  }, {
    tableName: 'scores'
  })

  return Score
}
