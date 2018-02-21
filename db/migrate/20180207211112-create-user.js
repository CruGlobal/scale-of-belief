'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      domain_userid: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      network_userid: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      },
      user_fingerprint: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      sso_guid: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      },
      gr_master_person_id: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: []
      },
      mcid: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      android_idfa: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      apple_idfa: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('users')
  }
}
