'use strict'

// Table Names
const UNSCORED_TABLE_NAME = 'unscored'
const EVENTS_TABLE_NAME = 'events'
const SCORES_TABLE_NAME = 'scores'

// Postgres Functions
const ADD_UNSCORED_FUNCTION = 'add_unscored_uri()'
const ADD_UNSCORED_FUNCTION_SQL = `CREATE OR REPLACE FUNCTION ${ADD_UNSCORED_FUNCTION}
RETURNS TRIGGER AS
$$
BEGIN
  INSERT INTO ${UNSCORED_TABLE_NAME}(uri)
  SELECT NEW.uri
  WHERE NOT EXISTS (
    SELECT uri FROM ${SCORES_TABLE_NAME} WHERE uri = NEW.uri
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ language plpgsql;`
const RE_ADD_UNSCORED_FUNCTION = 're_add_unscored_uri()'
const RE_ADD_UNSCORED_FUNCTION_SQL = `CREATE OR REPLACE FUNCTION ${RE_ADD_UNSCORED_FUNCTION}
RETURNS TRIGGER AS
$$
BEGIN
  INSERT INTO ${UNSCORED_TABLE_NAME}(uri)
  SELECT OLD.uri
  WHERE NOT EXISTS (
    SELECT uri FROM ${SCORES_TABLE_NAME} WHERE uri = OLD.uri
  )
  ON CONFLICT DO NOTHING;
  RETURN OLD;
END;
$$ language plpgsql;`
const DEL_UNSCORED_FUNCTION = 'del_unscored_uri()'
const DEL_UNSCORED_FUNCTION_SQL = `CREATE OR REPLACE FUNCTION ${DEL_UNSCORED_FUNCTION}
RETURNS TRIGGER AS
$$
BEGIN
  DELETE FROM ${UNSCORED_TABLE_NAME} WHERE uri = NEW.uri;
  RETURN NEW;
END;
$$ language plpgsql;`

// Postgres Triggers
const INSERT_EVENT_TRIGGER = 'trigger_insert_event'
const INSERT_EVENT_TRIGGER_SQL = `CREATE TRIGGER ${INSERT_EVENT_TRIGGER}
AFTER INSERT ON ${EVENTS_TABLE_NAME}
FOR EACH ROW
WHEN (NEW.uri IS NOT NULL)
EXECUTE PROCEDURE ${ADD_UNSCORED_FUNCTION};`
const INSERT_UPDATE_SCORE_TRIGGER = 'trigger_insert_update_score'
const INSERT_UPDATE_SCORE_TRIGGER_SQL = `CREATE TRIGGER ${INSERT_UPDATE_SCORE_TRIGGER}
AFTER INSERT OR UPDATE ON ${SCORES_TABLE_NAME}
FOR EACH ROW
EXECUTE PROCEDURE ${DEL_UNSCORED_FUNCTION};`
const DELETE_SCORE_TRIGGER = 'trigger_delete_score'
const DELETE_SCORE_TRIGGER_SQL = `CREATE TRIGGER ${DELETE_SCORE_TRIGGER}
AFTER DELETE ON ${SCORES_TABLE_NAME}
FOR EACH ROW
WHEN (OLD.uri IS NOT NULL)
EXECUTE PROCEDURE ${RE_ADD_UNSCORED_FUNCTION};`

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable(UNSCORED_TABLE_NAME, {
        uri: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.STRING(2048)
        }
      })
      // Add a unique index on the primary key "uri"
      .then(() => queryInterface.addIndex(UNSCORED_TABLE_NAME, {
        fields: ['uri'],
        unique: true,
        name: `idx_${UNSCORED_TABLE_NAME}_uri`
      }))
      // Add a prefix index on "uri"
      .then(() => queryInterface.addIndex(UNSCORED_TABLE_NAME, {
        fields: ['uri'],
        operator: 'text_pattern_ops',
        name: `idx_${UNSCORED_TABLE_NAME}_uri_prefix`
      }))
      .then(() => queryInterface.sequelize.query(ADD_UNSCORED_FUNCTION_SQL))
      .then(() => queryInterface.sequelize.query(RE_ADD_UNSCORED_FUNCTION_SQL))
      .then(() => queryInterface.sequelize.query(DEL_UNSCORED_FUNCTION_SQL))
      .then(() => queryInterface.sequelize.query(INSERT_EVENT_TRIGGER_SQL))
      .then(() => queryInterface.sequelize.query(INSERT_UPDATE_SCORE_TRIGGER_SQL))
      .then(() => queryInterface.sequelize.query(DELETE_SCORE_TRIGGER_SQL))
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${INSERT_EVENT_TRIGGER} ON ${EVENTS_TABLE_NAME}`)
      .then(queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${INSERT_UPDATE_SCORE_TRIGGER} ON ${SCORES_TABLE_NAME}`))
      .then(queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${DELETE_SCORE_TRIGGER} ON ${SCORES_TABLE_NAME}`))
      .then(queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS ${ADD_UNSCORED_FUNCTION}, ${RE_ADD_UNSCORED_FUNCTION}, ${DEL_UNSCORED_FUNCTION}`))
      .then(queryInterface.dropTable('unscored', {}))
  }
}
