/**
 * @summary A property-value pair representing an additional characteristics of the entitity, e.g. a product feature or another characteristic for which there is no matching property in schema.org.
 * @description
 * Property Of:
 * - {@link Place}
 * - {@link Product}
 * @see http://schema.org/additionalProperty
 * @typedef {PropertyValue} additionalProperty
 */

/**
 * @summary Physical address of the item.
 * @description
 * Property Of:
 * - {@link GeoCoordinates}
 * - {@link Organization}
 * - {@link Person}
 * - {@link Place}
 * @see http://schema.org/address
 * @typedef {(string|PostalAddress)} address
 */

/**
 * @summary An award won by or for this item.
 * @description
 * Property Of:
 * - {@link Organization}
 * - {@link Person}
 * - {@link Product}
 * @see http://schema.org/award
 * @typedef {(string|Array<string>)} award
 */

/**
 * @summary The brand(s) associated with a product or service, or the brand(s) maintained by an organization or business person.
 * @description
 * Property Of:
 * - {@link Organization}
 * - {@link Product}
 * - {@link Person}
 * @see http://schema.org/brand
 * @typedef {Organization} brand
 */

/**
 * @summary A contact point for a person or organization.
 * @description
 * Property Of:
 * - {@link Organization}
 * - {@link Person}
 * @see http://schema.org/contactPoint
 * @typedef {(ContactPoint|Array<ContactPoint>)} contactPoint
 */

/**
 * @summary Email address.
 * @description
 * Property Of:
 * - {@link ContactPoint}
 * - {@link Organization}
 * - {@link Person}
 * @see http://schema.org/email
 * @typedef {string} email
 */

/**
 * @summary The location of for example where the event is happening, an organization is located, or where an action takes place.
 * @description
 * Property Of:
 * - {@link Event}
 * - {@link Organization}
 * @see http://schema.org/location
 * @typedef {(string|Place|PostalAddress|Array<(string|Place|PostalAddress)>)} location
 */

/**
 * @summary An associated logo.
 * @description
 * Property Of:
 * - {@link Organization}
 * - {@link Place}
 * - {@link Product}
 * @see http://schema.org/logo
 * @typedef {(URL|ImageObject|Array<(URL|ImageObject)>)} logo
 */

/**
 * @summary The telephone number.
 * @description
 * Property Of:
 * - {@link ContactPoint}
 * - {@link Organization}
 * - {@link Person}
 * - {@link Place}
 * @see http://schema.org/telephone
 * @typedef {string} telephone
 */
