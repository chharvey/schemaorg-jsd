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
 * @const {Array<!Object>}
 * @property {Array<!Object>} DATATYPES All JSON Schemata validating Schema.org DataTypes.
 * @property {Array<!Object>} TYPES All JSON Schemata validating Schema.org Types.
 * @property {Array<!Object>} MEMBERS All JSON Schemata validating Schema.org Members.
 */
const SCHEMATA = fs.readdirSync(path.join(__dirname, './schema/'), 'utf8')
  .filter((filename) => path.parse(filename).ext === '.jsd')
  .map((filename) => requireOther(path.join(__dirname, './schema/', filename)))

/**
 * @summary All JSON Schemata validating Schema.org DataTypes.
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
 * @summary A Promise returned after validation.
 * @promise module:index.ValidationPromise
 * @resolve {boolean} `true` if the document passes validation
 * @reject  {TypeError} if the document fails validation; has a `.details` property for validation details
 */
/**
 * @summary Validate a JSON document against a Schema.org JSON schema.
 * @description
 * This function is `async`, which means it returns a Promise object.
 * Use with `await` inside your own async function to settle the promise.
 *
 * NOTE: Since JSDoc doesn’t mark up Promises, the jsdoc comment defining the
 * {@link module:index.ValidationPromise} type is repeated below for your convenience:
 * ```js
 * /**
 *  * @summary A Promise returned after validation.
 *  * @promise module:index.ValidationPromise
 *  * @resolve {boolean} `true` if the document passes validation
 *  * @reject  {TypeError} if the document fails validation; has a `.details` property for validation details
 *  *&#x002f;
 * ```
 *
 * @example
 * async function compile(jsdoc) {
 *   let is_valid;
 *   try {
 *     is_valid = await sdoValidate(jsdoc)
 *   } catch (e) {
 *     is_valid = false
 *   }
 *   console.log(is_valid)
 * }
 * // or you could use its Promise:
 * function compilePromise(jsdoc) {
 *   sdoValidate(jsdoc)
 *     .then((data) => data)
 *     .catch((e) => false)
 *     .then((result) => { console.log(result) })
 * }
 *
 * @alias module:index.sdoValidate
 * @param   {(!Object|string)} document the JSON or JSON-LD object to test, or its path pointing to a `.json` or `.jsonld` file
 * @param   {string=} type the name of the Type to test against; should be a Class in http://schema.org/
 *                         ; see the API for supported Types
 *                         ; if omitted, will test against the JSON document’s `@type` property (if it has one)
 *                         ; if the `@type` is not supported or cannot be found, defaults to `'Thing'`
 * @returns {module:index.ValidationPromise} the promise returned after validation
 * @ returns {boolean} `true` if the document passes validation
 * @ throws  {TypeError} if the document fails validation
 */
async function sdoValidate(document, type = null) {
  return sdoValidateSync(document, type) // NOTE `async` dictates this function return a `Promise` object
}

/**
 * @summary Synchronous version of {@link module:index.sdoValidate|sdoValidate}
 * @example
 * async function compileSync(jsdoc) {
 *   let is_valid;
 *   try {
 *     is_valid = sdoValidateSync(jsdoc)
 *   } catch (e) {
 *     is_valid = false
 *   }
 *   console.log(is_valid)
 * }
 * @alias module:index.sdoValidateSync
 * @param   {(!Object|string)} document the JSON or JSON-LD object to test, or its path pointing to a `.json` or `.jsonld` file
 * @param   {string=} type the name of the Type to test against; should be a Class in http://schema.org/
 *                         ; see the API for supported Types
 *                         ; if omitted, will test against the JSON document’s `@type` property (if it has one)
 *                         ; if the `@type` is not supported or cannot be found, defaults to `'Thing'`
 * @returns {boolean} `true` if the document passes validation
 * @throws  {TypeError} if the document fails validation
 */
function sdoValidateSync(document, type = null) {
  let doc = (typeof document === 'string') ? requireOther(document) : document
  let name;
  if (type === null) {
    let doctype = doc['@type']
    if (doctype) {}
    if (SCHEMATA.find((jsd) => jsd.title === `http://schema.org/${doctype}`)) {
      name = doctype
    } else {
      if (doctype) console.warn(`Class \`${doctype}\` is not yet supported. Validating against \`Thing.jsd\` instead.`)
      else console.warn(`JSON-LD \`@type\` property was not found. Validating against \`Thing.jsd\`.`)
      name = 'Thing'
    }
  } else {
    name = type
  }
  let is_data_valid = ajv.validate(`https://chharvey.github.io/schemaorg-jsd/schema/${name}.jsd`, doc)
  if (!is_data_valid) {
    let e = new TypeError(`Document ${doc['@id'] || doc.identifier || doc} does not valiate against schema ${name}.jsd!`)
    if (typeof document === 'string') e.filename = document
    e.details = ajv.errors
    throw e
  }
  return true
}


/**
 * Use this module to validate your JSON-LD document against a Schema.org JSON schema.
 * @module index
 */
module.exports = {META_SCHEMATA, SCHEMATA, sdoValidate, sdoValidateSync}
