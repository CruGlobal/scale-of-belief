'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('api_users', {
      guid: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
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
    return queryInterface.dropTable('api_users')
  }
}
