'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('api_keys', 'type', Sequelize.STRING)
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('api_keys', 'type')
  }
}
