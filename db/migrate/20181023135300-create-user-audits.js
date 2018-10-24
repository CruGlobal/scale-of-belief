'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('user_audits', {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        old_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true
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
      .then(() => queryInterface.addIndex('user_audits', {fields: ['updated_at']}))
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('user_audits', {})
  }
}
