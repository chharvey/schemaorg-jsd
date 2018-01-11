const fs   = require('fs')
const path = require('path')

const Ajv = require('ajv')

const requireOther = require('./requireOther.js')

// Create a new Ajv instance, add (and validate) all the files in `../schema` as schemata, and return it.
module.exports = function validateSchemata() {
  return new Ajv().addSchema(
    fs.readdirSync(path.join(__dirname, '../schema/'), 'utf8').map((filename) =>
      requireOther(path.join(__dirname, '../schema/', filename))
    )
  )
}
