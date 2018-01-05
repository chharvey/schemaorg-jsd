/**
 * @summary The most generic type of item.
 * @typedef {!Object} Thing
 * @property {string=} name The name of the item.
 * @property {string=} description A description of the item.
 * @property {string=} url URL of the item.
 */

/**
 * @summary Structured values are used when the value of a property has a more complex structure than simply being a textual value or a reference to another thing.
 * @typedef {Thing} StructuredValue
 */

/**
 * @summary A property-value pair, e.g. representing a feature of a product or place. Use the 'name' property for the name of the property. If there is an additional human-readable version of the value, put that into the 'description' property.
 * @typedef {StructuredValue} PropertyValue
 * @property {(boolean|number|StructuredValue)=} value The value of the quantitative value or property value node.
 */
