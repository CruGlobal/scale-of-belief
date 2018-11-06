'use strict'

const rollbar = require('../../config/rollbar')
const Recommendation = require('../../models/recommendation')
const User = require('../../models/user')
const Placement = require('../../models/placement')
const {Op} = require('sequelize')
const {isEmpty, shuffle} = require('lodash')

const get = async (request, response) => {
  try {
    const [page, users] = await Promise.all([
      Recommendation.findById(request.query['entity.id']),
      User.findAll({where: {mcid: {[Op.contains]: [request.query['profile.mcid']]}}, attributes: ['id']})
    ])
    if (page === null || isEmpty(users)) {
      return render404(response)
    }

    const user = users[0]
    const placement = await (new Placement(user).calculate())
    if (placement.placement === null) {
      return render404(response)
    }

    const recommendations = await page.findRecommended(placement.placement)
    if (recommendations.length <= 0) {
      return render404(response)
    }

    // Take the first 3 and shuffle them, slice returns less than 3 if the array has less.
    const shuffled = shuffle(recommendations.slice(0, 3))

    response.render('recommendations', {current: page, recommendations: shuffled})
  } catch (err) {
    rollbar.error('Recommendations error: ' + err, err)
    response.status(500)
    response.json({
      message: 'Internal Server Error',
      error: err.message
    })
  }
}

const render404 = (response) => {
  response.status(404)
  response.json({
    message: 'Not Found'
  })
}

module.exports = {
  get: get
}
