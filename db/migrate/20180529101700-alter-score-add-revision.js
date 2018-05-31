'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('scores', 'revision', Sequelize.INTEGER)
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('scores', 'revision')
  }
}
