const fs   = require('fs')
const path = require('path')

const Ajv = require('ajv')

/**
 * Validate a JSON document against a Schema.org JSON schema file.
 * @param   {(!Object|string)} document the JSON or JSON-LD object to test, or its path pointing to a `.json` or `.jsonld` file
 * @param   {string} type the name of the Type to test against; should be a Class in http://schema.org/
 *                        ; see {@link ./docs/api/} for supported Types
 * @returns {boolean} `true` if the document passes validation, `false` if it fails
 */
function sdoValidate(document, type) {
  let schema = JSON.parse(fs.readFileSync(path.join(__dirname, `./schema/${type}.jsd`), 'utf8'))
  let doc = (typeof document === 'string') ? JSON.parse(fs.readFileSync(document, 'utf8')) : document
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
