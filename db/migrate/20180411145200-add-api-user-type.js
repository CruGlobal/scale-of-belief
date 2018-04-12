'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('api_users', 'type', Sequelize.STRING)
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('api_users', 'type')
  }
}
