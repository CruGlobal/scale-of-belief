'use strict'

const sequelize = require('../config/sequelize')
const {reduce, replace} = require('lodash')

class Placement {
  static get QUERY () {
    return 'SELECT ' +
      'CAST(to_char(AVG(scores.unaware), \'FM9.999\') AS NUMERIC) as unaware, ' +
      'CAST(to_char(AVG(scores.curious), \'FM9.999\') AS NUMERIC) as curious, ' +
      'CAST(to_char(AVG(scores.follower), \'FM9.999\') AS NUMERIC) as follower, ' +
      'CAST(to_char(AVG(scores.guide), \'FM9.999\') AS NUMERIC) as guide, ' +
      'CAST(to_char(AVG(scores.unaware * (scores.confidence/100)), \'FM9.999\') AS NUMERIC) as weighted_unaware, ' +
      'CAST(to_char(AVG(scores.curious * (scores.confidence/100)), \'FM9.999\') AS NUMERIC) as weighted_curious, ' +
      'CAST(to_char(AVG(scores.follower * (scores.confidence/100)), \'FM9.999\') AS NUMERIC) as weighted_follower, ' +
      'CAST(to_char(AVG(scores.guide * (scores.confidence/100)), \'FM9.999\') AS NUMERIC) as weighted_guide ' +
      'FROM events ' +
      'INNER JOIN scores as scores ON scores.uri = events.uri ' +
      'WHERE events.user_id = :user_id AND events.created_at > current_timestamp - interval \'90\' day'
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
        self._values = results[0]
        return self
      })
  }

  get values () {
    return typeof this._values === 'undefined' ? {} : {
      unaware: this._values['unaware'] || 0,
      curious: this._values['curious'] || 0,
      follower: this._values['follower'] || 0,
      guide: this._values['guide'] || 0
    }
  }

  get weightedValues () {
    return typeof this._values === 'undefined' ? {} : {
      weighted_unaware: this._values['weighted_unaware'] || 0,
      weighted_curious: this._values['weighted_curious'] || 0,
      weighted_follower: this._values['weighted_follower'] || 0,
      weighted_guide: this._values['weighted_guide'] || 0
    }
  }

  get placement () {
    return reduce(this.values, (acc, value, key) => {
      return value > acc.value ? {name: key, value: value} : acc
    }, {name: 'unaware', value: 0}).name
  }

  get weightedPlacement () {
    let name = reduce(this.weightedValues, (acc, value, key) => {
      return value > acc.value ? {name: key, value: value} : acc
    }, {name: 'weighted_unaware', value: 0}).name
    return replace(name, 'weighted_', '')
  }
}

module.exports = Placement
