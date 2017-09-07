/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
// const debug = require('debug')('flobot-solr-plugin')
const SolrService = require('./../lib/components/services/solr/index.js').serviceClass

describe('Simple solr tests', function () {
  let solrService
  it('should create some basic flobot services', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [],
        config: {}
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        solrService = flobotServices.solr
        expect(solrService).to.not.eql(null)
        done()
      }
    )
  })

  it('generate a SQL CREATE VIEW from a model and an attribute', () => {
    const plugin = new SolrService()
    const model = {
      'title': 'address',
      'description': '...',
      'primaryKey': ['uprn'],
      'type': 'object',
      'properties': {
        'uprn': {
          'type': 'integer',
          'maxLength': 12,
          'description': '...'
        },
        'streetName': {
          'type': 'string',
          'maxLength': 128,
          'description': '...'
        },
        'postCode': {
          'type': 'string',
          'maxLength': 10,
          'description': '...'
        }
      },
      'required': ['uprn']
    }
    const attribute = {
      'modelId': 'address',
      'attributeMapping': {
        'address': '@streetName'
      }
    }

    const select = plugin.generateSelect(model, attribute)

    expect(select).to.be.a('string')
  })
})
