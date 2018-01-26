const JSONSchema  = require('./JSONSchema.class.js')

/**
 * A wrapper of a JSON Schema, validating a document representing the value of a Schema.org member.
 * @private
 */
class JSONSchemaMember extends JSONSchema {
  /**
   * @summary Construct a new JSONSchemaMember object.
   * @param {!Object} json_schema a JSON Schema object, validating against {@link https://chharvey.github.io/schemaorg-jsd/meta/member.jsd#}
   *                              (or {@link https://chharvey.github.io/schemaorg-jsd/meta/member-subschema.jsd#/anyOf/1})
   * @param {string=} json_schema.$schema not allowed if this member is a subschema
   * @param {string} json_schema.$id
   * @param {string} json_schema.title
   * @param {string} json_schema.description
   * @param {Array<!Object>} json_schema.anyOf
   */
  constructor(json_schema) {
    super(json_schema)
  }

  /**
   * @summary A JSDoc comment using `@typedef` marking up this member.
   * @type {string}
   */
  get jsdocTypedefTag() {
    return `
/**
 * @summary ${this._jsd.description}
 * @see ${this._jsd.title}
 * @typedef {${JSONSchemaMember.jsdocTypeDeclaration(this._jsd)}} ${this.label}
 */
    `
  }

  /**
   * @summary A JSDoc `@property` tag marking up this member.
   * @param   {string=} member_of the name of a type to which this member belongs (used only if the `$ref` string is relative and contains `#`)
   * @returns {string} `' * @property {‹type›=} ‹label› ‹comment›'`
   */
  jsdocPropertyTag(member_of = '!Object') {
    let type_decl = (this._jsd.$schema) ? this.label : JSONSchemaMember.jsdocTypeDeclaration(this._jsd).replace(/#/g, member_of)
    return ` * @property {${type_decl}=} ${this.label} ${this.comment}`
  }

  /**
   * @summary A JSON object, using JSON-LD vocabulary.
   * @type {!Object}
   */
  get jsonld() {
    let returned = {
      '@type'           : 'sdo:Property',
      '@id'             : `sdo:${this.name}`,
      'sdo:name'        : this.label,
      'sdo:description' : this.comment,
    }
    return returned
  }


  /**
   * @summary The JSDoc-style type declaration of a JSON Schema object.
   * @description The argument may be any arbitrary JSON schema, not necessarily one that must validate against
   * `/meta/type.jsd` or `meta/member.jsd`.
   * @param {(!Object|boolean)} jsd any JSON schema
   * @returns {?string} a JSDoc type declaration as a string, e.g., `'(boolean|number|string)'`, or `null` if the type cannot be determined
   */
  static jsdocTypeDeclaration(jsd) {
    if (jsd.$ref)  return path.parse(jsd.$ref).name
    if (jsd.allOf) return new SDOType(jsd.allOf[0]).jsDocType
    if (jsd.anyOf) return `(${jsd.anyOf.map((j) => JSONSchemaMember.jsdocTypeDeclaration(j)).join('|')})`
    if (jsd.type) {
      const returned = (Array.isArray(jsd.type)) ? `(${jsd.type.join('|')})` : jsd.type
      return returned.replace('array','Array').replace('object','!Object')
    }
    return null
  }
}

module.exports = JSONSchemaMember
