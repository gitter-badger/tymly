'use strict'

module.exports = function timestampLessThanEqualsOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (inputValue <= comparisonValue) {
    nextState = candidateStateName
  }
  return nextState
}
