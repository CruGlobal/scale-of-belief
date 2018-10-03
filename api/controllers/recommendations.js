'use strict'

const rollbar = require('../../config/rollbar')
const Recommendation = require('../../models/recommendation')
const User = require('../../models/user')
const Placement = require('../../models/placement')
const {Op} = require('sequelize')

const get = async (request, response) => {
  try {
    const [page, user] = await Promise.all([
      Recommendation.findById(request.query['entity.id']),
      User.findOne({where: {mcid: {[Op.contains]: [request.query['profile.mcid']]}}})
    ])
    if (page === null || user === null) {
      return render404(response)
    }

    const placement = await (new Placement(user).calculate())
    if (placement.placement === null) {
      return render404(response)
    }

    const recommendations = await page.findRecommended(placement.placement)
    if (recommendations.length <= 0) {
      return render404(response)
    }

    response.render('recommendations', {current: page, recommendations: recommendations})
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
