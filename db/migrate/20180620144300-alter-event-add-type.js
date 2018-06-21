'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    // Add events.type column
    return queryInterface.addColumn('events', 'type', Sequelize.STRING(64))
      // Add events.web_id column
      .then(() => queryInterface.addColumn('events', 'web_id', Sequelize.UUID))
      // Remove and events with NULL event_id
      .then(() => queryInterface.sequelize.query('DELETE FROM events WHERE event_id IS NULL'))
      // Update events.event_id to require a value
      .then(() => queryInterface.changeColumn('events', 'event_id', {type: Sequelize.UUID, allowNull: false}))
      // Remove events by duplicate event_id keeping the most recent
      .then(() => queryInterface.sequelize.query('DELETE FROM events a USING events b WHERE a.created_at < b.created_at AND a.event_id = b.event_id'))
      // Add unique index on events.event_id
      .then(() => queryInterface.addIndex('events', {fields: ['event_id'], unique: true}))
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('events', 'type')
      .then(queryInterface.removeColumn('events', 'web_id'))
      .then(() => queryInterface.removeIndex('events', ['event_id']))
  }
}
