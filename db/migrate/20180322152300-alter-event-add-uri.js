'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('events', 'uri', Sequelize.STRING)
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('events', 'uri')
  }
}
