'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    // Create the materialized view "unscored"
    return queryInterface.sequelize.query(
      'CREATE MATERIALIZED VIEW unscored AS ' +
      '(SELECT DISTINCT events.uri ' +
      'FROM events LEFT JOIN scores USING (uri) ' +
      'WHERE scores.uri IS NULL) ' +
      'WITH DATA')
      // Add a unique index on the primary key "uri"
      .then(() => queryInterface.addIndex('unscored', {fields: ['uri'], unique: true, name: 'idx_unscored_uri'}))
      // Add a prefix index on "uri"
      .then(() => queryInterface.addIndex('unscored', {fields: ['uri'], operator: 'text_pattern_ops', name: 'idx_unscored_uri_prefix'}))
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('unscored', 'idx_unscored_uri')
      .then(queryInterface.removeIndex('unscored', 'idx_unscored_uri_prefix'))
      .then(() => queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS unscored'))
  }
}
