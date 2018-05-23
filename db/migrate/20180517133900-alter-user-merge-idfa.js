'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('users', 'android_idfa', 'device_idfa'),
      queryInterface.removeColumn('users', 'apple_idfa')
    ])
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('users', 'device_idfa', 'android_idfa'),
      queryInterface.addColumn('users', 'apple_idfa', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      })
    ])
  }
}
