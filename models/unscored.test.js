'use strict'

const Unscored = require('./unscored')
const factory = require('../test/factory')
const { omit } = require('lodash')
const paperTrail = require('../config/papertrail')
const Revisions = paperTrail['revisions']

describe('Unscored', () => {
  it('should be defined', () => {
    expect(Unscored).toBeDefined()
  })

  //created by: jonahktjala
  describe('Unscored.toScoreObject()', () => {
    let unscored
    beforeEach(() => {
      return factory.create('unscored').then(existingScore => { unscored = existingScore })
    })
    const expectedApiScore = {
        uri: scoreObject.uri,
        score: -1,
        weight: 0
      }
    return Score.toScoreObject(scoreObject).then((result)=> {
        const exclude = ['last_refreshed']
        expect (result).toBeDefined()
        expect (result).not.toBeNull()
        expect (omit(result,exclude)).toEqual(expectedApiScore)
      })
  })

  //created by: jonahktjala
  describe('Unscored.getAllUris()', () => {
    let score
    beforeEach(() => {
      return factory.create('existing_score').then(existingScore => { score = existingScore })
    })

    it('should not return a null array of scored objects', () => {
      expect.assertions(5);
      return Score.getAllUris().then((result)=>{
        //make sure that output is not null
        expect (result).not.toBeNull()
        expect (result).toBeDefined()
        let oneEntry = result[0]
        
        //check that property values are not null
        const exclude = ['revision']
        expect (oneEntry).toBeDefined()
        expect (oneEntry).not.toBeNull()
        expect (oneEntry).toHaveProperty(omit(score.dataValues,exclude).keys())
      })
    })
  })

  afterAll(() => {
    Revisions.destroy({truncate: true})
  })
})
