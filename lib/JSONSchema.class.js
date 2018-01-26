const path = require('path')
const url  = require('url')

/**
 * Parent class for all the kinds of JSON schema to parse.
 */
class JSONSchema {
  /**
   * @summary Construct a new JSONSchema object.
   * @param {!Object} json_schema a valid JSON Schema object
   * @param {string} json_schema.title equal to `'http://schema.org/‹refs:label›'`
   * @param {string} json_schema.description `rdfs:comment`
   */
  constructor(json_schema) {
    /**
     * @summary The raw JSON schema object.
     * @private
     * @type {!Object}
     */
    this._jsd = json_schema
  }

  /**
   * @summary The `rdfs:label` (title or name) of this schema. E.g., "Thing", "Place", "description", "sameAs".
   * @type {string}
   */
  get label() { return path.parse(new url.URL(this._jsd.title).pathname).name }

  /**
   * @summary The `rdfs:comment` (description) of this type.
   * @type {string}
   */
  get comment() { return this._jsd.description }
}

module.exports = JSONSchema
