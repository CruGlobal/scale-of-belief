'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('scores', {
      uri: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      unaware: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      curious: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      follower: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      guide: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      confidence: {
        type: Sequelize.DOUBLE,
        defaultValue: 0
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('scores')
  }
}
