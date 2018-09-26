'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('recommendations', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.CHAR(32)
        },
        url: {
          type: Sequelize.STRING(2048),
          allowNull: false
        },
        score: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        title: Sequelize.TEXT,
        message: Sequelize.TEXT,
        thumbnail_url: Sequelize.STRING(2048),
        language: Sequelize.STRING(8),
        categories: {
          type: Sequelize.ARRAY(Sequelize.STRING),
          defaultValue: []
        }
      })
      .then(() => queryInterface.addIndex('recommendations', {fields: ['url'], unique: true}))
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('recommendations', {})
  }
}
