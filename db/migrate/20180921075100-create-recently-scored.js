'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('recently_scored', {
      uri: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(2048)
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('recently_scored')
  }
}
