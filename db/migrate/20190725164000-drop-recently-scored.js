'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP TABLE IF EXISTS recently_scored')
  },
  down: (queryInterface, Sequelize) => {
    // Can't revert
    return Promise.resolve()
  }
}
