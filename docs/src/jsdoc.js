/**
 * @summary A contact point—for example, a Customer Complaints department.
 * @see http://schema.org/ContactPoint
 * @typedef {StructuredValue} ContactPoint
 * @property {string=} email Email address.
 * @property {string=} telephone The telephone number.
 */

/**
 * @summary The most generic type of item.
 * @see http://schema.org/Thing
 * @typedef {!Object} Thing
 * @property {string=} name The name of the item.
 * @property {string=} description A description of the item.
 * @property {string=} url URL of the item.
 */

/**
 * @summary Structured values are used when the value of a property has a more complex structure than simply being a textual value or a reference to another thing.
 * @see http://schema.org/StructuredValue
 * @typedef {Thing} StructuredValue
 */

/**
 * @summary An organization such as a school, NGO, corporation, club, etc.
 * @see http://schema.org/Organization
 * @typedef {Thing} Organization
 * @property {(string|PostalAddress)=} address Physical address of the item.
 * @property {(ContactPoint|Array<ContactPoint>)=} contactPoint A contact point for a person or organization.
 * @property {(string|Place|PostalAddress)=} location The location of for example where the event is happening, an organization is located, or where an action takes place.
 */

/**
 * @summary A person (alive, dead, undead, or fictional).
 * @see http://schema.org/Person
 * @typedef {Thing} Person
 * @property {(ContactPoint|Array<ContactPoint>)=} contactPoint A contact point for a person or organization.
 * @property {string=} email Email address.
 * @property {string=} telephone The telephone number.
 */

/**
 * @summary Entities that have a somewhat fixed, physical extension.
 * @see http://schema.org/Place
 * @typedef {Thing} Place
 * @property {(string|PostalAddress)=} address Physical address of the item.
 */

/**
 * @summary The mailing address.
 * @see http://schema.org/PostalAddress
 * @typedef {ContactPoint} PostalAddress
 */

/**
 * @summary A property-value pair, e.g. representing a feature of a product or place. Use the 'name' property for the name of the property. If there is an additional human-readable version of the value, put that into the 'description' property.
 * @see http://schema.org/PropertyValue
 * @typedef {StructuredValue} PropertyValue
 * @property {(boolean|number|string|StructuredValue)=} value The value of the quantitative value or property value node.
 */
