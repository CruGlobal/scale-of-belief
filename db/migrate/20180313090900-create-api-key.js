'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('api_keys', {
      api_key: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      system: {
        type: Sequelize.STRING,
        defaultValue: 'unknown'
      },
      api_pattern: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      contact_email: {
        type: Sequelize.STRING
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('api_keys')
  }
}
