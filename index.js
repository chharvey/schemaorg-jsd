const fs   = require('fs')
const path = require('path')

const Ajv = require('ajv')

/**
 * Validate a JSON document against a Schema.org JSON schema file.
 * @param   {string} filepath the path of the JSON document to test; should be a `.json` or `.jsonld` file
 * @param   {string} type the name of the Type to test against; should be a Class in http://schema.org/
 *                        ; see {@link ./docs/api/} for supported Types
 * @returns {boolean} `true` if the document passes validation, `false` otherwise
 */
function sdoValidate(filepath, type) {
  let schema, doc;
  try {
    schema = require(`./schema/${type}.jsd`)
  } catch (e) {
    schema = JSON.parse(fs.readFileSync(path.join(__dirname, `./schema/${type}.jsd`), 'utf8'))
  }
  try {
    doc = require(filepath)
  } catch (e) {
    doc = JSON.parse(fs.readFileSync(filepath, 'utf8'))
  }
  let ajv = new Ajv()
  let is_data_valid = ajv.validate(schema, doc)
  if (!is_data_valid) {
    console.error(`Data ${filepath} does not valiate against schema ${type}.jsd!`)
    console.error(ajv.errors)
    return false
  }
  return true
}

module.exports = sdoValidate
