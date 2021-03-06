/* eslint-env mocha */

'use strict'

const path = require('path')
const expect = require('chai').expect
const tymly = require('../lib')
const STATE_MACHINE_NAME = 'tymlyTest_setRegistryKey_1_0'

describe('It should test the state resource for setting reg keys', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let statebox
  let registry

  it('Should run Tymly Service', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/animal-blueprint')
        ],
        config: {
          caches: {
            registryKeys: {}
          }
        }
      },
      function (err, tymlyServices) {
        expect(err).to.equal(null)
        statebox = tymlyServices.statebox
        registry = tymlyServices.registry
        done()
      }
    )
  })

  it('should get the value from registry using key', function (done) {
    let key = 'tymlyTest_mealThreshold'
    let value = registry.get(key)
    expect(value).to.eql(3)
    done()
  })

  it('Should test the state resource execution', function (done) {
    statebox.startExecution(
      {
        key: 'tymlyTest_mealThreshold',
        value: 2
      },
      STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('should get the value from registry using key after calling set', function (done) {
    let key = 'tymlyTest_mealThreshold'
    let value = registry.get(key)
    expect(value).to.eql(2)
    done()
  })
})
