'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // Add score and weight columns
      queryInterface.addColumn('scores', 'score', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      }),
      queryInterface.addColumn('scores', 'weight', {
        type: Sequelize.INTEGER,
        defaultValue: 1
      }),
      // Remove unaware, curious, follower, guide, confidence columns
      queryInterface.removeColumn('scores', 'unaware'),
      queryInterface.removeColumn('scores', 'curious'),
      queryInterface.removeColumn('scores', 'follower'),
      queryInterface.removeColumn('scores', 'guide'),
      queryInterface.removeColumn('scores', 'confidence')
    ])
  },
  down: (queryInterface, Sequelize) => {
    // Can't revert
    return Promise.resolve()
  }
}
