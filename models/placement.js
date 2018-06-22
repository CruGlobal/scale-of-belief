'use strict'

const sequelize = require('../config/sequelize')

class Placement {
  static get QUERY () {
    return `SELECT
        scores.score AS placement,
        SUM(scores.weight) AS weight
      FROM
        events
        INNER JOIN scores as scores ON scores.uri = events.uri AND scores.weight > 0
      WHERE
        events.user_id = :user_id
      GROUP BY
        scores.score
      ORDER BY
        weight DESC,
        placement ASC
      LIMIT 1`
  }

  /**
   * @param {User} user
   */
  constructor (user) {
    this.user = user
  }

  /**
   * @returns {Promise}
   */
  calculate () {
    let self = this
    return sequelize()
      .query(Placement.QUERY, {replacements: {user_id: this.user.id}, type: sequelize().QueryTypes.SELECT})
      .then(results => {
        self._placement = results[0].placement
        return self
      })
  }

  get placement () {
    return this._placement || 0
  }
}

module.exports = Placement
