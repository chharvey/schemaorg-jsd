const JSONSchema  = require('./JSONSchema.class.js')

/**
 * A wrapper of a JSON Schema, validating a document representing a Schema.org `DataType` (or subtype).
 */
class JSONSchemaDataType extends JSONSchema {
  /**
   * @summary Construct a new JSONSchemaClass object.
   * @param {!Object} json_schema a valid JSON Schema object
   * @param {string} json_schema.$schema equal to `'http://json-schema.org/draft-07/schema#'`
   * @param {string} json_schema.$id equal to `'https://chharvey.github.io/schemaorg-jsd/schema/‹label›.jsd'`
   * @param {string} json_schema.title
   * @param {string} json_schema.description
   */
  constructor(json_schema) {
    super(json_schema)
  }

  /**
   * @summary A JSDoc comment using `@typedef` marking up this type.
   * @type {string}
   */
  get jsdocTypedefTag() {
    return `
/**
 * @summary ${this._jsd.description}
 * @see ${this._jsd.title}
 * @typedef {${this._jsd.type}} ${this.label}
 */
    `
  }

  /**
   * @summary A JSON object, using JSON-LD vocabulary.
   * @type {!Object}
   */
  get jsonld() {
    let returned = {
      '@type'           : 'sdo:DataType',
      '@id'             : `sdo:${this.label}`,
      'sdo:name'        : this.label,
      'sdo:description' : this.comment,
    }
    return returned
  }
}

module.exports = JSONSchemaDataType
