/* eslint-env mocha */

'use strict'

const chai = require('./../node_modules/chai')
const expect = chai.expect
const path = require('path')
const tymly = require('tymly')

describe('Heritage tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const STATE_MACHINE_NAME = 'wmfs_refreshFromCsvFile_1_0'

  let statebox
  let client

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        done()
      }
    )
  })

  it('should execute importingCsvFiles', function (done) {
    statebox.startExecution(
      {
        sourceDir: path.resolve(__dirname, './fixtures/input')
      },
      STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentStateName).to.equal('ImportingCsvFiles')
        done()
      }
    )
  })

  it('Should be the correct data in the database', function (done) {
    client.query(
      'select uprn, address, info from wmfs.heritage order by uprn;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rowCount).to.eql(13)
          expect(result.rows[0].uprn).to.eql('1234567890')
          expect(result.rows[4].uprn).to.eql('1234567894')
          expect(result.rows[10].uprn).to.eql('12345678910')
          done()
        }
      }
    )
  })

  it('Should be clean up the database', function (done) {
    client.query(
      `DELETE FROM wmfs.heritage WHERE uprn::text LIKE '123456789%';`,
      function (err, result) {
        expect(result.rowCount).to.eql(13)
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          done()
        }
      }
    )
  })

  it('Should find a now empty database', function (done) {
    client.query(
      'select * from wmfs.heritage;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql([])
          done()
        }
      }
    )
  })
})
