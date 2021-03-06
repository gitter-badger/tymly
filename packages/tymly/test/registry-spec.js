/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect

describe('Registry tests', function () {
  const tymly = require('./../lib')

  this.timeout(process.env.TIMEOUT || 5000)

  let registryService

  it('should load the cat blueprint (which has some registry keys)', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')
        ],

        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/cats-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        registryService = tymlyServices.registry
        done()
      }
    )
  })

  it('should find the value is correctly set in the registry', function () {
    expect(registryService.registry.tymlyTest_mealThreshold.value).to.eql(3)
  })

  it('should get the value from registry using key', function (done) {
    let key = 'tymlyTest_mealThreshold'
    let value = registryService.get(key)
    expect(value).to.eql(3)
    done()
  })

  it('should change the value in registry using key', function (done) {
    let key = 'tymlyTest_mealThreshold'
    registryService.set(key, 2, function (err) {
      expect(err).to.eql(null)
      expect(registryService.get(key)).to.eql(2)
      done()
    })
  })
})
