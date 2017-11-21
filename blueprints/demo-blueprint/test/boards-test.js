/* eslint-env mocha */

'use strict'

const chai = require('./../node_modules/chai')
const expect = chai.expect
const path = require('path')
const tymly = require('tymly')

describe('Boards tests', function () {
  this.timeout(5000)
  let boards

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-users-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        boards = tymlyServices.boards.boards
        done()
      }
    )
  })

  it('should get boards', function (done) {
    expect(boards['tymly_expense'].boardTitleTemplate).to.eql('Dashboard')
    done()
  })
})
