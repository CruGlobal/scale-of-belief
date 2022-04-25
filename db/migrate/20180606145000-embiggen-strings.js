'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('events', 'uri', { type: Sequelize.STRING(2048) }),
      queryInterface.changeColumn('scores', 'uri', {
        type: Sequelize.STRING(2048),
        allowNull: false,
        primaryKey: true
      }),
      queryInterface.changeColumn('revisions', 'document_id', {
        type: Sequelize.STRING(2048),
        allowNull: false
      })
    ])
  },
  down: (queryInterface, Sequelize) => {
    // Can't revert
    return Promise.resolve()
  }
}
