'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('scores', {
      uri: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      unaware: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 4
        }
      },
      curious: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 4
        }
      },
      follower: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 4
        }
      },
      guide: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 4
        }
      },
      confidence: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 1,
          isFloat: true
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('scores')
  }
}
