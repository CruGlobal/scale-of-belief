'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS unscored')
  },
  down: (queryInterface, Sequelize) => {
    // Can't revert
    return Promise.resolve()
  }
}
