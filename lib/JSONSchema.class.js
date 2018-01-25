const path = require('path')
const url  = require('url')

const {SCHEMATA} = require('../index.js')

/**
 * A wrapper for a JSON Schema object, with some methods.
 * @private
 */
class JSONSchema {
  /**
   * @summary Construct a new JSONSchema object.
   * @param {(!Object|boolean)} json_schema a JSON Schema object, validating against {@link http://json-schema.org/draft-07/schema#}
   */
  constructor(json_schema) {
    this._jsd = json_schema
  }

  /**
   * @summary The name of this DataType, Class, or Property, if it is one; else `null`.
   * @type {?string}
   */
  get name() {
    return (this._jsd.title) ? path.parse(new url.URL(this._jsd.title).pathname).name : null
  }

  /**
   * @summary If this schema is a class that is not `Thing`, its superclass; else null
   * @type {?string}
   */
  get superclass() {
    return (this.name !== 'Thing' && this._jsd.allOf) // a schema has an `allOf` if and only if it validates a Class
      ? path.parse(this._jsd.allOf[0]['$ref']).name
      : null
  }

  /**
   * @summary The JSDoc-style type of this JSON Schema object.
   * @description A JSDoc type description as a string, e.g., `'(boolean|number|string)'`.
   * @type {string}
   */
  get jsdocTypeDescription() {
    if (this._jsd.$ref) {
      return this._jsd.$ref.split('.')[0]
    } else if (this._jsd.allOf) {
      return new SDOType(this._jsd.allOf[0]).jsDocType
    } else if (this._jsd.anyOf) {
      return `(${this._jsd.anyOf.map((jsd) => new JSONSchema(jsd).jsdocTypeDescription).join('|')})`
    } else if (this._jsd.type) {
      if (Array.isArray(this._jsd.type)) return `(${this._jsd.type.join('|')})`.replace('array','Array').replace('object','!Object')
      else return this._jsd.type.replace('array','Array').replace('object','!Object')
    } else {
      return 'boolean'
    }
  }

  /**
   * @summary A JSDoc comment using `@typedef` marking up a Schema.org DataType.
   * @type {string}
   */
  get jsdocDataDef() {
    return `
/**
 * @summary ${this._jsd.description}
 * @see ${this._jsd.title}
 * @typedef {${new JSONSchema(this._jsd).jsdocTypeDescription}} ${this.name}
 */
    `
  }

  /**
   * @summary A JSDoc comment using `@typedef` marking up a Schema.org Type.
   * @type {string}
   */
  get jsdocTypeDef() {
    let properties = Object.entries(this._jsd.allOf[1].properties).map(function (entry) {
      // Try finding the `*.prop.jsd` file first, else use the `entry[1]` object.
      let prop_schema = SCHEMATA.find((jsd) => jsd.title===`http://schema.org/${entry[0]}`) || entry[1]
      return new JSONSchema(prop_schema).jsdocPropertyTag(entry[0], this.name)
    }, this)
    return `
/**
 * @summary ${this._jsd.description}
 * @see ${this._jsd.title}
 * @typedef {${(this.name === 'Thing') ? '!Object' : this.superclass}} ${this.name}
${properties.join('\n')}
 */
    `
  }

  /**
   * @summary A JSDoc comment using `@typedef` marking up a Schema.org Property.
   * @type {string}
   */
  get jsdocPropertyDef() {
    return `
/**
 * @summary ${this._jsd.description}
 * @see ${this._jsd.title}
 * @typedef {${new JSONSchema(this._jsd).jsdocTypeDescription}} ${this.name}
 */
    `
  }

  /**
   * @summary A JSDoc `@property` tag marking up a Schema.org Property.
   * @param   {string} variable the name or identifier of this property
   * @param   {string=} propname the name of the Type to which this property belongs (used only if `#` is in the `$ref` string)
   * @returns {string} `' * @property {‹type›=} ‹variable› ‹description›'`
   */
  jsdocPropertyTag(variable, propname = '!Object') {
    let type = new JSONSchema(this._jsd).jsdocTypeDescription.replace(/#/g, propname)
    return ` * @property {${type}=} ${variable} ${this._jsd.description}`
  }

  /**
   * @summary A JSON object, using JSON-LD vocabulary.
   * @type {!Object}
   */
  get jsonld() {
    return {
      '@type'           : JSONSchema.SCHEMA_TYPE[this._jsd.$schema],
      '@id'             : `sdo:${this.name}`,
      'sdo:name'        : this.name,
      'sdo:description' : this._jsd.description,
    }
  }
}

/**
 * @summary the type of a schema.
 * @description The type of the schema is determined by its `$schema` property.
 * This object has `$schema` URI keys, and
 * and its values include `'DataType'`, `'Class'`, and `'Property'`.
 * @const {!Object<string>}
 */
JSONSchema.SCHEMA_TYPE = {
  "http://json-schema.org/draft-07/schema#"                     : "DataType",
  "https://chharvey.github.io/schemaorg-jsd/meta/type.jsd#"     : "Class",
  "https://chharvey.github.io/schemaorg-jsd/meta/type-root.jsd#": "Class",
  "https://chharvey.github.io/schemaorg-jsd/meta/member.jsd#"   : "Property",
}

module.exports = JSONSchema
