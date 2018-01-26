const fs   = require('fs')
const path = require('path')
const url  = require('url')

const Ajv = require('ajv')

const requireOther = require('./lib/requireOther.js')

/**
 * @summary the type of a schema.
 * @description The type of the schema is determined by its `$schema` property.
 * This object’s keys are `$schema` URIs, and
 * and its values include `'DataType'`, `'Class'`, and `'Property'`
 * (which are Schema.org types).
 * @private
 * @const {!Object<string>}
 */
const SCHEMA_TYPE = {
  'http://json-schema.org/draft-07/schema#'                  : 'DataType',
  'https://chharvey.github.io/schemaorg-jsd/meta/type.jsd#'  : 'Class',
  'https://chharvey.github.io/schemaorg-jsd/meta/member.jsd#': 'Property',
}

/**
 * @summary An array of meta-schemata against which the content schemata validate.
 * @description This is for internal use only. Users should not be expected to use these meta-schemata.
 * @private
 * @alias module:index.META_SCHEMATA
 * @const {Array<!Object>}
 */
const META_SCHEMATA = fs.readdirSync(path.join(__dirname, './meta/'), 'utf8')
  .filter((filename) => path.parse(filename).ext === '.jsd')
  .map((filename) => requireOther(path.join(__dirname, './meta/', filename)))

/**
 * @summary An array of all JSON Schemata validating Schema.org vocabulary.
 * @description This array contains all Schema.org schemata in this project.
 * That is, schemata against which your JSON-LD documents should validate.
 * @alias module:index.SCHEMATA
 * @todo TODO: reference json-ld.jsd externally
 * @const {Array<!Object>}
 */
const SCHEMATA = fs.readdirSync(path.join(__dirname, './schema/'), 'utf8')
  .filter((filename) => path.parse(filename).ext === '.jsd')
  .map((filename) => requireOther(path.join(__dirname, './schema/', filename)))

/**
 * @summary All JSON Schemata validating Schema.org Classes.
 * @alias module:index.SCHEMATA.DATATYPES
 * @const {Array<!Object>}
 */
SCHEMATA.DATATYPES = SCHEMATA
  .filter((jsd) => path.parse(new url.URL(jsd['$id']).pathname).name !== 'json-ld') // TODO: reference json-ld.jsd externally
  .filter((jsd) => SCHEMA_TYPE[jsd.$schema] === 'DataType')

/**
 * @summary All JSON Schemata validating Schema.org Types.
 * @alias module:index.SCHEMATA.TYPES
 * @const {Array<!Object>}
 */
SCHEMATA.TYPES = SCHEMATA
  .filter((jsd) => path.parse(new url.URL(jsd['$id']).pathname).name !== 'json-ld') // TODO: reference json-ld.jsd externally
  .filter((jsd) => SCHEMA_TYPE[jsd.$schema] === 'Class')

/**
 * @summary All JSON Schemata validating Schema.org Members.
 * @alias module:index.SCHEMATA.MEMBERS
 * @const {Array<!Object>}
 */
SCHEMATA.MEMBERS = SCHEMATA
  .filter((jsd) => path.parse(new url.URL(jsd['$id']).pathname).name !== 'json-ld') // TODO: reference json-ld.jsd externally
  .filter((jsd) => SCHEMA_TYPE[jsd.$schema] === 'Property')

// set up and validate all the schemata. done only once.
let ajv = new Ajv().addMetaSchema(META_SCHEMATA).addSchema(SCHEMATA)


/**
 * @summary Validate a JSON document against a Schema.org JSON schema.
 * @description This function can be either synchronous or asynchronous, depending on whether
 * a callback function is provided as the third parameter.
 * @alias module:index.sdoValidate
 * @param   {(!Object|string)} document the JSON or JSON-LD object to test, or its path pointing to a `.json` or `.jsonld` file
 * @param   {string} type the name of the Type to test against; should be a Class in http://schema.org/
 *                        ; see the API for supported Types
 * @param   {Function=} callback standard callback with `(err, data)` as the params
 *                               ; this method is asynchronous if and only if the callback is provided
 * @returns {boolean} `true` if the document passes validation
 * @throws  {TypeError} if the document fails validation
 */
function sdoValidate(document, type, callback = null) {
  let doc = (typeof document === 'string') ? requireOther(document) : document
  let is_data_valid = ajv.validate(`https://chharvey.github.io/schemaorg-jsd/schema/${type}.jsd`, doc)
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


/**
 * Use this module to validate your JSON-LD document against a Schema.org JSON schema.
 * @module index
 */
module.exports = {META_SCHEMATA, SCHEMATA, sdoValidate}
