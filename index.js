const fs   = require('fs')
const path = require('path')

const Ajv = require('ajv')

const requireOther     = require('./lib/requireOther.js')
const validateSchemata = require('./lib/validateSchemata.js')


// set up and validate all the schemata. done only once.
let ajv = validateSchemata()

/**
 * @summary Validate a JSON document against a Schema.org JSON schema file.
 * @description This function can be either synchronous or asynchronous, depending on whether
 * a callback function is provided as the third parameter.
 * @param   {(!Object|string)} document the JSON or JSON-LD object to test, or its path pointing to a `.json` or `.jsonld` file
 * @param   {string} type the name of the Type to test against; should be a Class in http://schema.org/
 *                        ; see {@link ./docs/api/} for supported Types
 * @param   {Function=} callback standard callback with `(err, data)` as the params
 *                               ; this function is asynchronous if and only if the callback is provided
 * @returns {boolean} `true` if the document passes validation
 * @throws  {TypeError} if the document fails validation
 */
function sdoValidate(document, type, callback = null) {
  let schema = ajv.getSchema(`https://chharvey.github.io/schemaorg-jsd/schema/${type}.jsd`).schema
  let doc = (typeof document === 'string') ? requireOther(document) : document
  let is_data_valid = ajv.validate(schema, doc)
  if (!is_data_valid) {
    let e = new TypeError(`Document ${document['@id'] || document.identifier || document} does not valiate against schema ${type}.jsd!`)
    if (typeof document === 'string') e.filename = document
    e.details = ajv.errors
    if (!callback) {
      console.error(e)
      throw e
    }
    return (callback) ? setTimeout(callback, 100, e, false) : false
  }
  return (callback) ? setTimeout(callback, 100, null, true) : true
}

module.exports = sdoValidate
