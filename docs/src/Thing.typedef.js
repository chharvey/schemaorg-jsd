/**
 * @summary The most generic type of item.
 * @description
 * Value Of:
 * - {@link item}
 * - {@link itemListElement}
 * @see http://schema.org/Thing
 * @typedef {!Object} Thing
 * @property {URL=} additionalType An additional type for the item, typically used for adding more specific types from external vocabularies in microdata syntax. This is a relationship between something and a class that the thing is in.
 * @property {string=} description A description of the item.
 * @property {(string|URL|PropertyValue)=} identifier The identifier property represents any kind of identifier for any kind of Thing, such as ISBNs, GTIN codes, UUIDs etc.
 * @property {(URL|ImageObject|Array<(URL|ImageObject)>)=} image An image of the item. This can be a URL or a fully described ImageObject.
 * @property {string=} name The name of the item.
 * @property {URL=} url URL of the item.
 */
