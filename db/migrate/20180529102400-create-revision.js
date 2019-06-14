'use strict'
const sequelizePaperTrailOptions = {
  revisionAttribute: 'revision',
  revisionModel: 'revisions',
  revisionChangeModel: 'revision_changes'
}

module.exports = {
  up: function (queryInterface, Sequelize) {
    // Load default options.
    sequelizePaperTrailOptions.defaultAttributes = {
      documentId: 'document_id',
      revisionId: 'revision_id'
    }

    // Revision model
    var attributes = {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      model: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      document: {
        type: Sequelize.TEXT('MEDIUMTEXT'),
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }
    attributes[sequelizePaperTrailOptions.defaultAttributes.documentId] = {
      type: Sequelize.STRING,
      allowNull: false
    }
    attributes[sequelizePaperTrailOptions.revisionAttribute] = {
      type: Sequelize.INTEGER,
      allowNull: false
    }

    return queryInterface.createTable(sequelizePaperTrailOptions.revisionModel, attributes)

    /*
    attributes = {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      path: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      document: {
        type: Sequelize.TEXT('MEDIUMTEXT'),
        allowNull: false
      },
      diff: {
        type: Sequelize.TEXT('MEDIUMTEXT'),
        allowNull: false
      },
      revision_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }

    // RevisionChange model
    queryInterface.createTable(sequelizePaperTrailOptions.revisionChangeModel, attributes)
    */
  },

  down: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.dropTable(sequelizePaperTrailOptions.revisionModel)
//      queryInterface.dropTable(sequelizePaperTrailOptions.revisionChangeModel)
    ])
  }
}
