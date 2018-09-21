'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    // First we have to drop the existing materialized view if it exists
    return queryInterface.removeIndex('unscored', 'idx_unscored_uri')
      .then(queryInterface.removeIndex('unscored', 'idx_unscored_uri_prefix'))
      .then(() => queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS unscored'))

      // Then we re-create it with the new column
      .then(() => queryInterface.sequelize.query(
        'CREATE MATERIALIZED VIEW unscored AS ' +
        '(SELECT DISTINCT events.uri, now() as last_refreshed ' +
        'FROM events LEFT JOIN scores USING (uri) ' +
        'WHERE scores.uri IS NULL) ' +
        'WITH DATA'))

      // Now we can re-add the indexes
      .then(() => queryInterface.addIndex('unscored', {fields: ['uri'], unique: true, name: 'idx_unscored_uri'}))
      .then(() => queryInterface.addIndex('unscored', {fields: ['uri'], operator: 'text_pattern_ops', name: 'idx_unscored_uri_prefix'}))
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('unscored', 'idx_unscored_uri')
      .then(queryInterface.removeIndex('unscored', 'idx_unscored_uri_prefix'))
      .then(() => queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS unscored'))
      .then(() => queryInterface.sequelize.query(
        'CREATE MATERIALIZED VIEW unscored AS ' +
        '(SELECT DISTINCT events.uri ' +
        'FROM events LEFT JOIN scores USING (uri) ' +
        'WHERE scores.uri IS NULL) ' +
        'WITH DATA'))
      .then(() => queryInterface.addIndex('unscored', {fields: ['uri'], unique: true, name: 'idx_unscored_uri'}))
      .then(() => queryInterface.addIndex('unscored', {fields: ['uri'], operator: 'text_pattern_ops', name: 'idx_unscored_uri_prefix'}))
  }
}
