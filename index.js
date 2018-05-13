const fs   = require('fs')
const path = require('path')
const url  = require('url')
const util = require('util')

const Ajv = require('ajv')

const {requireOtherAsync} = require('./lib/requireOther.js')


/**
 * @module schemaorg-jsd
 */
module.exports = {
/**
 * @summary An array of meta-schemata against which the content schemata validate.
 * @description This is for internal use only. Users should not be expected to use these meta-schemata.
 * @returns {Array<!Object>} an array of meta-schemata
 */
async getMetaSchemata() {
  return Promise.all(
    (await util.promisify(fs.readdir)(path.resolve(__dirname, './meta/')))
      .filter((filename) => path.parse(filename).ext === '.jsd')
      .map((filename) => requireOtherAsync(path.resolve(__dirname, './meta/', filename)))
  )
},

/**
 * @summary An array of all JSON Schemata validating Schema.org vocabulary.
 * @description This array contains all Schema.org schemata in this project.
 * That is, schemata against which your JSON-LD documents should validate.
 * @returns {Array<!Object>} an array of schemata
 */
async getSchemata() {
  return Promise.all(
    (await util.promisify(fs.readdir)(path.resolve(__dirname, './schema/')))
      .filter((filename) => path.parse(filename).ext === '.jsd')
      .map((filename) => requireOtherAsync(path.resolve(__dirname, './schema/', filename)))
  )
},

/**
 * @summary Validate a JSON-LD document against a Schema.org JSON schema.
 * @example
 * const {sdoValidate} = require('schemaorg-jsd')
 * async function compile(jsdoc) {
 *   let is_valid;
 *   try {
 *     is_valid = await sdoValidate(jsdoc)
 *   } catch (e) {
 *     is_valid = false
 *   }
 *   console.log(is_valid)
 * }
 * // or you could use its Promise (if `async` keyword is not supported):
 * function compilePromise(jsdoc) {
 *   sdoValidate(jsdoc)
 *     .catch((e) => false)
 *     .then((result) => { console.log(result) })
 * }
 *
 * @param   {(!Object|string)} document the JSON or JSON-LD object to test, or its path pointing to a `.json` or `.jsonld` file
 * @param   {string=} type the name of the Type to test against; should be a Class in http://schema.org/
 *                         ; see the API for supported Types
 *                         ; if omitted, will test against the JSON document’s `@type` property (if it has one)
 *                         ; if the `@type` is not supported or cannot be found, defaults to `'Thing'`
 * @returns {boolean} `true` if the document passes validation
 * @throws  {TypeError} if the document fails validation; has a `.details` property for validation details
 */
async sdoValidate(document, type = null) {
  let doc = (typeof document === 'string') ? await requireOtherAsync(document) : document
  const [META_SCHEMATA, SCHEMATA] = await Promise.all([module.exports.getMetaSchemata(), module.exports.getSchemata()])
  if (type === null) {
    let doctype = doc['@type']
    if (SCHEMATA.find((jsd) => jsd.title === `http://schema.org/${doctype}`)) {
      type = doctype
    } else {
      if (doctype) console.warn(`Class \`${doctype}\` is not yet supported. Validating against \`Thing.jsd\` instead.`)
      else console.warn(`JSON-LD \`@type\` property was not found. Validating against \`Thing.jsd\`.`)
      type = 'Thing'
    }
  }
  let ajv = new Ajv().addMetaSchema(META_SCHEMATA).addSchema(SCHEMATA)
  let is_data_valid = ajv.validate(`https://chharvey.github.io/schemaorg-jsd/schema/${type}.jsd`, doc)
  if (!is_data_valid) {
    let e = new TypeError(`Document ${doc['@id'] || doc.identifier || doc.name || doc} does not valiate against schema ${type}.jsd!`)
    if (typeof document === 'string') e.filename = document
    e.details = ajv.errors
    throw e
  }
  return true
},
}
