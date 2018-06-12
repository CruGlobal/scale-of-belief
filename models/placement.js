'use strict'

const sequelize = require('../config/sequelize')

class Placement {
  static get QUERY () {
    return `SELECT
      CAST(ROUND(SUM(scores.score * scores.weight) / SUM(scores.weight)::numeric, 2) AS NUMERIC) as placement
    FROM
      events
      INNER JOIN scores as scores ON scores.uri = events.uri AND scores.weight > 0
    WHERE
      events.user_id = :user_id
      AND events.created_at > current_timestamp - interval '90' day`
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
