const JSONSchema  = require('./JSONSchema.class.js')

/**
 * A wrapper of a JSON Schema, validating a document representing a Schema.org `Thing` (or subtype).
 * @private
 */
class JSONSchemaType extends JSONSchema {
  /**
   * @summary Construct a new JSONSchemaType object.
   * @param {!Object} json_schema a JSON Schema object, validating against {@link https://chharvey.github.io/schemaorg-jsd/meta/type.jsd#}
   * @param {string} json_schema.$schema
   * @param {string} json_schema.$id
   * @param {string} json_schema.title
   * @param {string} json_schema.description
   * @param {Array<!Object>} json_schema.allOf
   */
  constructor(json_schema) {
    super(json_schema)

    /**
     * @summary A non-normative list of short names of known subtypes of this type.
     * @private
     * @type {Array<string>}
     */
    this._subtypes = []

    // /**
    //  * @summary The initialization state of this type.
    //  * @type {boolean}
    //  */
    // this._initialized = false
  }

  /**
   * @summary The `rdfs:subClassOf` (short name of this type’s supertype, the type that this extends).
   * @description If this is the root type (`Thing`), it does not extend anything, thus this value is `null`.
   * @type {?string}
   */
  get supertype() { return (this.label !== 'Thing') ? path.parse(this._jsd.allOf[0].$ref).name : null }

  /**
   * @summary The `rdfs:member` short names of listed members of this type.
   * @type {Array<string>}
   */
  get members() { return Object.keys(this._jsd.allOf[1].properties) }

  /**
   * @summary A non-normative list of known subtypes of this type.
   * @description This list is non-normative, as each existing subtype should have this type identified as its supertype.
   * This list is empty on construction, but can be pushed to as subtypes are made apparent.
   * @type {Array<string>}
   */
  get subtypes() { return this._subtypes.slice() }

  /**
   * @summary A JSDoc comment using `@typedef` marking up this type.
   * @type {string}
   */
  get jsdocTypedefTag() {
    const {SCHEMATA} = require('../index.js')
    const JSONSchemaMember = require('./JSONSchemaMember.class.js')

    let properties = this.members.map(function (member) {
      let member_obj = new JSONSchemaMember(
        // Try finding the `*.prop.jsd` file first, else use the subschema in the `properties` object.
        SCHEMATA.MEMBERS.find((jsd) => jsd.title===`http://schema.org/${member}`) ||
        this._jsd.allOf[1].properties[member]
      )
      return member_obj.jsdocPropertyTag(this.name)
    }, this)

    return `
/**
 * @summary ${this._jsd.description}
 * @see ${this._jsd.title}
 * @typedef {${(this.label === 'Thing') ? '!Object' : this.supertype}} ${this.label}
${properties.join('\n')}
 */
    `
//${(this.subtypes) ? ' * @description' : ''}
//${(this.subtypes) ? ' * Known subtypes:' : ''}
//${this.subtypes.map((str) => ` * - {@link ${str}}`).join('\n')}
  }

  /**
   * @summary A JSON object, using JSON-LD vocabulary.
   * @type {!Object}
   */
  get jsonld() {
    let returned = {
      '@type'           : 'sdo:Class',
      '@id'             : `sdo:${this.label}`,
      'sdo:name'        : this.label,
      'sdo:description' : this.comment,
      'rdfs:subClassOf' : (this.supertype) ? { '@id': `sdo:${this.supertype}` } : null,
      '$subtypes'       : `[${this.subtypes.map((s) => `sdo:${s}`).join()}]`,
    }
    return returned
  }

  /**
   * @summary Initialize this schema object.
   * @description Add more descriptive properties to this object, communicating with other linked schemata.
   */
  // init() {
  //   if (this._initialized) return;
  //   this._initialized = true
  //
  //   // Add this class as a known subclass to its superclass.
  //   let superclass = classes.find((obj) => obj.name===this.superclass) || null
  //   if (superclass) superclass.addSubclass(this.name)
  // }

  /**
   * @summary Add one or more subtype to this type’s list of tracked subtypes.
   * @param {...string} typenames one or more type names to add
   */
  addSubtype(...typenames) {
    this._subtypes.push(...typenames)
  }
}

module.exports = JSONSchemaType
