'use strict'
const _ = require('lodash')
const dottie = require('dottie')
module.exports = class SetContextData {
  init (resourceConfig, env, callback) {
    this.resourceConfig = resourceConfig
    callback(null)
  }

  run (event, context) {
    const FORM_DATA_STRING_LENGTH = 8
    const data = {}
    for (const key in this.resourceConfig) {
      let dottiePath
      let theKey
      if (_.isString(key)) {
        dottiePath = key
        if (dottiePath.length > 0) {
          if (dottiePath[0] === '$') {
            dottiePath = dottiePath.slice(1)
          }
        }
        if (dottiePath.length > 0) {
          if (dottiePath[0] === '.') {
            dottiePath = dottiePath.slice(1)
            theKey = dottiePath
          }
        }
        if (dottiePath.length > 0) {
          if (dottiePath.substring(0, FORM_DATA_STRING_LENGTH) === 'formData') {
            dottiePath = dottiePath.slice(FORM_DATA_STRING_LENGTH + 1)
          }
        }
      }
      // console.log(this.resourceConfig[key])
      if (this.resourceConfig[key] === '$NOW') {
        this.resourceConfig[key] = new Date().toISOString()
      } else if (this.resourceConfig[key] === '$USERID') {
        this.resourceConfig[key] = context.userId
      }
      dottie.set(data, theKey, this.resourceConfig[key])
    }
    console.log(data)
    context.sendTaskSuccess(data)
  }
}
