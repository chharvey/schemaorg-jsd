const Ajv = require('ajv')

const {requireOtherAsync} = require('./lib/requireOther.js')
const schematas = require('./lib/schemata.js')


/**
 * @module index
 * @summary Validate a JSON-LD document against a Schema.org JSON schema.
 * @example
 * const sdoValidate = require('schemaorg-jsd')
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
module.exports = async function sdoValidate(document, type = null) {
  let doc = (typeof document === 'string') ? await requireOtherAsync(document) : document
  const [META_SCHEMATA, SCHEMATA] = await Promise.all([schematas.getMetaSchemata(), schematas.getSchemata()])
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
}
