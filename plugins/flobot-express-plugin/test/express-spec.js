/* eslint-env mocha */

'use strict'
const PORT = 3003
const jwt = require('jsonwebtoken')
const rest = require('restler')
const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
const formsPluginDir = require.resolve('flobot-forms-plugin')

function sendToken (adminToken) {
  const options = {
    headers: {
      Accept: '*/*'
    }
  }
  if (adminToken) {
    options.headers.authorization = 'Bearer ' + adminToken
  }
  return options
}

describe('Simple Express tests', function () {
  this.timeout(5000)

  let app
  let adminToken
  // let irrelevantToken
  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'
  const executionsUrl = `http://localhost:${PORT}/executions/`
  const remitUrl = `http://localhost:${PORT}/remit/`
  let rupert
  let alan
  let statebox
  const Buffer = require('safe-buffer').Buffer

  it('should create a usable admin token for Dave', function () {
    adminToken = jwt.sign(
      {},
      new Buffer(secret, 'base64'),
      {
        subject: 'Dave',
        audience: audience
      }
    )
  })

  // it('should create a usable token for Steve', function () {
  //   irrelevantToken = jwt.sign(
  //     {},
  //     new Buffer(secret, 'base64'),
  //     {
  //       subject: 'Steve',
  //       audience: audience
  //     }
  //   )
  // })

  it('should create some basic flobot services to run a simple cat blueprint', function (done) {
    flobot.boot(
      {

        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          formsPluginDir,
          path.resolve(__dirname, './fixtures/plugins/cats-plugin')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')
        ],

        config: {

          staticRootDir: path.resolve(__dirname, './output'),

          auth: {
            secret: secret,
            audience: audience
          },

          defaultUsers: {
            'Dave': ['fbotTest_fbotTestAdmin'],
            'Steve': ['spaceCadet']
          }

        }

      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        app = flobotServices.server.app
        statebox = flobotServices.statebox
        flobotServices.rbac.rbac.debug()
        done()
      }
    )
  })

  it('should start Express app', function (done) {
    app.listen(PORT, function () {
      console.log('\n')
      console.log(`Example app listening on port ${PORT}!\n`)
      done()
    })
  })

  // CHECK THAT A VALID JWT REQUIRED TO USE /flobots API
  // ---------------------------------------------------

  it('should fail to create a new Flobot without a JWT', function (done) {
    rest.postJson(
      executionsUrl,
      {
        namespace: 'fbot',
        stateMachineName: 'cat',
        version: '1.0',
        data: {petName: 'Rupert'}
      }
    ).on(
      'complete',
      function (rupert, res) {
        expect(res.statusCode).to.equal(401)
        done()
      }
    )
  })

  it('should fail updating a Flobot without a JWT', function (done) {
    rest.putJson(
      executionsUrl + '/' + alan,
      {
        action: 'SendTaskHeartbeat',
        output: {
          sound: 'Car engine'
        }
      }
    ).on('complete', function (errHtml, res) {
      expect(res.statusCode).to.equal(401)
      done()
    })
  })

  it('should fail getting a Flobot without a JWT', function (done) {
    rest.get(executionsUrl + rupert).on('complete', function (badFlobot, res) {
      expect(res.statusCode).to.equal(401)
      done()
    })
  })

  it('should fail getting the user\'s remit without a JWT', function (done) {
    rest.get(remitUrl).on('complete', function (remit, res) {
      expect(res.statusCode).to.equal(401)
      done()
    })
  })

  // VALID JWTs SHOULD WORK
  // ----------------------
  it('should create a new Rupert execution', function (done) {
    rest.postJson(
      executionsUrl,
      {
        namespace: 'fbotTest',
        stateMachineName: 'cat',
        version: '1.0',
        input: {
          petName: 'Rupert',
          gender: 'male',
          hoursSinceLastMotion: 11,
          hoursSinceLastMeal: 5,
          petDiary: []
        }
      },
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(201)
      expect(executionDescription.status).to.eql('RUNNING')
      expect(executionDescription.currentStateName).to.eql('WakingUp')
      expect(executionDescription.ctx.petName).to.eql('Rupert')
      rupert = executionDescription.executionName
      done()
    })
  })

  it('should get Rupert execution description', function (done) {
    rest.get(
      executionsUrl + '/' + rupert,
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(200)
      expect(executionDescription.ctx.petName).to.equal('Rupert')
      done()
    })
  })

  it('should successfully complete Rupert\'s day', function (done) {
    statebox.waitUntilStoppedRunning(
      rupert,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('fbotTest_cat_1_0')
        expect(executionDescription.currentStateName).to.eql('Sleeping')
        expect(executionDescription.ctx.hoursSinceLastMeal).to.eql(0)
        expect(executionDescription.ctx.hoursSinceLastMotion).to.eql(0)
        expect(executionDescription.ctx.gender).to.eql('male')
        expect(executionDescription.ctx.petDiary).to.be.an('array')
        expect(executionDescription.ctx.petDiary[0]).to.equal('Look out, Rupert is waking up!')
        expect(executionDescription.ctx.petDiary[2]).to.equal('Rupert is walking... where\'s he off to?')
        expect(executionDescription.ctx.petDiary[6]).to.equal('Shh, Rupert is eating...')
        done()
      }
    )
  })

  it('should create a new Alan execution', function (done) {
    rest.postJson(
      executionsUrl,
      {
        namespace: 'fbotTest',
        stateMachineName: 'listeningCat',
        version: '1.0',
        input: {
          petName: 'Alan',
          gender: 'male',
          petDiary: []
        }
      },
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(201)
      expect(executionDescription.status).to.eql('RUNNING')
      expect(executionDescription.currentStateName).to.eql('WakingUp')
      expect(executionDescription.ctx.petName).to.eql('Alan')
      alan = executionDescription.executionName
      done()
    })
  })

  it('should wait a while', function (done) {
    setTimeout(done, 250)
  })

  it('should update Alan execution with a heartbeat', function (done) {
    rest.putJson(
      executionsUrl + '/' + alan,
      {
        action: 'SendTaskHeartbeat',
        output: {
          sound: 'Car engine'
        }
      },
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(200)
      expect(executionDescription.status).to.equal('RUNNING')
      expect(executionDescription.currentStateName).to.equal('Listening')
      expect(executionDescription.ctx.sound).to.equal('Car engine')
      done()
    })
  })

  it('should wait a while longer', function (done) {
    setTimeout(done, 250)
  })

  it('should sendTaskSuccess() to the Alan execution', function (done) {
    rest.putJson(
      executionsUrl + '/' + alan,
      {
        action: 'SendTaskSuccess',
        output: {
          order: [
            {
              product: 'Fresh Tuna',
              quantity: 25
            }
          ]
        }
      },
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(200)
      done()
    })
  })

  it('should successfully complete Alans\'s awakening', function (done) {
    statebox.waitUntilStoppedRunning(
      alan,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('fbotTest_listeningCat_1_0')
        expect(executionDescription.currentStateName).to.eql('Sleeping')
        expect(executionDescription.ctx.gender).to.eql('male')
        expect(executionDescription.ctx.petDiary).to.be.an('array')
        expect(executionDescription.ctx.petDiary[0]).to.equal('Look out, Alan is waking up!')
        expect(executionDescription.ctx.petDiary[1]).to.equal('Alan is listening for something... what will he hear?')
        expect(executionDescription.ctx.petDiary[2]).to.equal('Sweet dreams Alan! x')
        expect(executionDescription.ctx.formData.order[0]).to.eql(
          {
            product: 'Fresh Tuna',
            quantity: 25
          }
        )
        done()
      }
    )
  })

  /*
      it('should cancel a new Alan flobot', function (done) {
        rest.del(
            executionsUrl + alanFlobotId,
          sendToken(adminToken)).on('complete', function (rupert, res) {
            expect(res.statusCode).to.equal(204)
            done()
          })
      })

      it("should fail getting Alan, now that he's been cancelled", function (done) {
        rest.get(executionsUrl + alanFlobotId, sendToken(adminToken)).on('complete', function (err, res) {
          expect(res.statusCode).to.equal(404)
          expect(err.error).to.eql('Not Found')
          expect(err.message).to.be.a('string')
          done()
        })
      })

      it('should fail to create a new Rupert flobot (irrelevant roles)', function (done) {
        rest.postJson(
          executionsUrl,
          {
            namespace: 'fbotTest',
            stateMachineName: 'cat',
            version: '1.0',
            data: {petName: 'Rupert'}
          }, sendToken(irrelevantToken)).on('complete', function (err, res) {
            expect(res.statusCode).to.equal(403)
            expect(err.error).to.equal('Forbidden')
            expect(err.message).to.equal('No roles permit this action')
            done()
          })
      })

      // GET USER'S "REMIT"
      // ------------------

      it("should get the user's remit", function (done) {
        rest.get(remitUrl, sendToken(adminToken)).on('complete', function (remit, res) {
          expect(res.statusCode).to.equal(200)
          done()
        })
      })
      */
})
