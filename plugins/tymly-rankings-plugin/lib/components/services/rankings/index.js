'use strict'

const _ = require('lodash')
const async = require('async')
const generateViewStatement = require('./generate-view-statement')
const generateStats = require('./generate-stats')

class RankingService {
  boot (options, callback) {
    const client = options.bootedServices.storage.client
    const rankings = options.blueprintComponents.rankings

    if (!_.isObject(rankings)) {
      options.messages.info('No rankings to find')
      return callback(null)
    }

    options.messages.info('Finding rankings')

    const rankingKeysWithValues = Object.keys(rankings).filter(key => {
      const value = rankings[key]
      if (value.source && value.factors) {
        return key
      }
    })

    async.each(rankingKeysWithValues, (key, cb) => {
      const value = rankings[key]
      client.query(
        generateViewStatement({
          category: _.snakeCase(value.name),
          schema: _.snakeCase(value.namespace),
          source: value.source,
          ranking: value.factors,
          registry: options.bootedServices.registry.registry[key]
        }),
        (err) => {
          if (err) cb(err)
          generateStats({
            client: client,
            category: value.name,
            schema: value.namespace,
            pk: value.source.property,
            name: 'test' // TODO: 'test' should be inferred
          }, (err) => {
            if (err) cb(err)
            cb()
          })
        }
      )
    }, (err) => {
      if (err) callback(err)
      callback(null)
    })
  }
}

module.exports = {
  serviceClass: RankingService,
  bootAfter: ['registry']
}
