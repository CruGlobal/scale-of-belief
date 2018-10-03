'use strict'

const {DataTypes} = require('sequelize')
const sequelize = require('../config/sequelize')
const titleCaps = require('../vendor/title-caps')
const {last} = require('lodash')
const DEFAULT_CATEGORY = 'Cru.org'
const RECOMMENDED_QUERY = `WITH recommended AS (
  SELECT *, array_length(ARRAY (
    SELECT UNNEST(categories)
    INTERSECT
    SELECT UNNEST(ARRAY[:categories]::VARCHAR(255)[])
    ), 1) as overlap,
    random() as rand
  FROM recommendations
  WHERE categories && ARRAY[:categories]::VARCHAR(255)[] AND message IS NOT NULL
)
(SELECT * FROM recommended WHERE score = :placement ORDER BY overlap DESC NULLS LAST, rand LIMIT 1)
UNION ALL
(SELECT * FROM recommended WHERE score = (:placement + 1) ORDER BY overlap DESC NULLS LAST, rand LIMIT 1)
UNION ALL
(SELECT * FROM recommended WHERE score = (:placement - 1) ORDER BY overlap DESC NULLS LAST, rand LIMIT 1)
UNION ALL
(SELECT * FROM recommended WHERE score >= (:placement - 2) ORDER BY overlap DESC NULLS LAST, rand LIMIT 3)`

const Recommendation = sequelize().define('Recommendation', {
  id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.CHAR(32)
  },
  url: {
    get () {
      return this.getDataValue('url').toLowerCase()
    },
    set (val) {
      /* istanbul ignore else */
      if (val) {
        this.setDataValue('url', val.toLowerCase())
      } else {
        this.setDataValue('url', val)
      }
    },
    type: DataTypes.STRING(2048),
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 10
    }
  },
  title: DataTypes.TEXT,
  message: DataTypes.TEXT,
  thumbnail_url: DataTypes.STRING(2048),
  language: DataTypes.STRING(8),
  categories: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'recommendations',
  underscored: true,
  timestamps: false
})

Recommendation.prototype.__defineGetter__('category', function () {
  const category = last(this.categories) || DEFAULT_CATEGORY
  return titleCaps(category.replace(/-/gi, ' '))
})

Recommendation.prototype.findRecommended = function (placement) {
  return sequelize().query(RECOMMENDED_QUERY, {
    replacements: {categories: this.categories, placement: placement},
    type: sequelize().QueryTypes.SELECT,
    model: Recommendation
  })
}

module.exports = Recommendation
