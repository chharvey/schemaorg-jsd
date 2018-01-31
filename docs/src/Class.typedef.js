/**
 * @summary A contact point—for example, a Customer Complaints department.
 * @description
 * Value Of:
 * - {@link contactPoint}
 * @see http://schema.org/ContactPoint
 * @typedef {StructuredValue} ContactPoint
 * @property {email=} email Email address.
 * @property {telephone=} telephone The telephone number.
 */

/**
 * @summary An event happening at a certain time and location, such as a concert, lecture, or festival.
 * @see http://schema.org/Event
 * @typedef {Thing} Event
 * @property {(Date|DateTime)=} endDate The end date and time of the item (in ISO 8601 date format).
 * @property {location=} location The location of for example where the event is happening, an organization is located, or where an action takes place.
 * @property {(Date|DateTime)=} startDate The start date and time of the item (in ISO 8601 date format).
 */

/**
 * @summary The geographic coordinates of a place or event.
 * @description
 * Value Of:
 * - {@link geo}
 * @see http://schema.org/GeoCoordinates
 * @typedef {StructuredValue} GeoCoordinates
 * @property {address=} address Physical address of the item.
 * @property {(string|number)=} elevation The elevation of a location (WGS 84).
 * @property {(string|number)=} latitude The latitude of a location (WGS 84).
 * @property {(string|number)=} longitude The longitude of a location (WGS 84).
 */

/**
 * @summary An image file.
 * @description
 * Value Of:
 * - {@link image}
 * - {@link logo}
 * @see http://schema.org/ImageObject
 * @typedef {Thing} ImageObject
 */

/**
 * @summary A utility class that serves as the umbrella for a number of 'intangible' things such as quantities, structured values, etc.
 * @see http://schema.org/Intangible
 * @typedef {Thing} Intangible
 */

/**
 * @summary A list of items of any sort.
 * @see http://schema.org/ItemList
 * @typedef {Intangible} ItemList
 * @property {(string|Thing|ListItem|Array<(string|Thing|ListItem)>)=} itemListElement For itemListElement values, you can use simple strings (e.g. "Peter", "Paul", "Mary"), existing entities, or use ListItem.
 * @property {number=} numberOfItems The number of items in an ItemList. Note that some descriptions might not fully describe all items in a list (e.g., multi-page pagination); in such cases, the numberOfItems would be for the entire list.
 */

/**
 * @summary A listing that describes a job opening in a certain organization.
 * @see http://schema.org/JobPosting
 * @typedef {Intangible} JobPosting
 * @property {Organization=} hiringOrganization Organization offering the job position.
 * @property {Place=} jobLocation A (typically single) geographic location associated with the job position.
 * @property {(string|Array<string>)=} responsibilities Responsibilities associated with this role or Occupation.
 * @property {string=} title The title of the job.
 */

/**
 * @summary A list item.
 * @description
 * Value Of:
 * - {@link itemListElement}
 * - {@link nextItem}
 * - {@link previousItem}
 * @see http://schema.org/ListItem
 * @typedef {Intangible} ListItem
 * @property {Thing=} item An entity represented by an entry in a list or data feed.
 * @property {ListItem=} nextItem A link to the ListItem that follows the current one.
 * @property {ListItem=} previousItem A link to the ListItem that preceeds the current one.
 * @property {(number|string)=} position The position of an item in a series or sequence of items.
 */

/**
 * @summary An organization such as a school, NGO, corporation, club, etc.
 * @description
 * Value Of:
 * - {@link brand}
 * - {@link hiringOrganization}
 * - {@link manufacturer}
 * @see http://schema.org/Organization
 * @typedef {Thing} Organization
 * @property {address=} address Physical address of the item.
 * @property {award=} award An award won by or for this item.
 * @property {brand=} brand The brand(s) associated with a product or service, or the brand(s) maintained by an organization or business person.
 * @property {contactPoint=} contactPoint A contact point for a person or organization.
 * @property {email=} email Email address.
 * @property {location=} location The location of for example where the event is happening, an organization is located, or where an action takes place.
 * @property {logo=} logo An associated logo.
 * @property {telephone=} telephone The telephone number.
 */

/**
 * @summary A person (alive, dead, undead, or fictional).
 * @see http://schema.org/Person
 * @typedef {Thing} Person
 * @property {string=} additionalName An additional name for a Person, can be used for a middle name.
 * @property {address=} address Physical address of the item.
 * @property {award=} award An award won by or for this item.
 * @property {brand=} brand The brand(s) associated with a product or service, or the brand(s) maintained by an organization or business person.
 * @property {contactPoint=} contactPoint A contact point for a person or organization.
 * @property {email=} email Email address.
 * @property {string=} familyName Family name. In the U.S., the last name of an Person. This can be used along with givenName instead of the name property.
 * @property {string=} givenName Given name. In the U.S., the first name of a Person. This can be used along with familyName instead of the name property.
 * @property {string=} honorificPrefix An honorific prefix preceding a Person's name such as Dr/Mrs/Mr.
 * @property {string=} honorificSuffix An honorific suffix preceding a Person's name such as M.D. /PhD/MSCSW.
 * @property {telephone=} telephone The telephone number.
 */

/**
 * @summary Entities that have a somewhat fixed, physical extension.
 * @description
 * Value Of:
 * - {@link jobLocation}
 * - {@link location}
 * @see http://schema.org/Place
 * @typedef {Thing} Place
 * @property {additionalProperty=} additionalProperty A property-value pair representing an additional characteristics of the entitity, e.g. a product feature or another characteristic for which there is no matching property in schema.org.
 * @property {address=} address Physical address of the item.
 * @property {GeoCoordinates=} geo The geo coordinates of the place.
 * @property {logo=} logo An associated logo.
 * @property {telephone=} telephone The telephone number.
 */

/**
 * @summary The mailing address.
 * @description
 * Value Of:
 * - {@link address}
 * - {@link location}
 * @see http://schema.org/PostalAddress
 * @typedef {ContactPoint} PostalAddress
 * @property {string=} addressCountry The country.
 * @property {string=} addressLocality The locality.
 * @property {string=} addressRegion The region.
 * @property {string=} postOfficeBoxNumber The post office box number for PO box addresses.
 * @property {string=} postalCode The postal code.
 * @property {string=} streetAddress The street address.
 */

/**
 * @summary Any offered product or service.
 * @see http://schema.org/Product
 * @typedef {Thing} Product
 * @property {additionalProperty=} additionalProperty A property-value pair representing an additional characteristics of the entitity, e.g. a product feature or another characteristic for which there is no matching property in schema.org.
 * @property {award=} award An award won by or for this item.
 * @property {brand=} brand The brand(s) associated with a product or service, or the brand(s) maintained by an organization or business person.
 * @property {string=} color The color of the product.
 * @property {logo=} logo An associated logo.
 * @property {Organization=} manufacturer The manufacturer of the product.
 * @property {string=} productID The product identifier, such as ISBN.
 * @property {string=} sku The Stock Keeping Unit (SKU), i.e. a merchant-specific identifier for a product or service, or the product to which the offer refers.
 */

/**
 * @summary A property-value pair, e.g. representing a feature of a product or place. Use the 'name' property for the name of the property. If there is an additional human-readable version of the value, put that into the 'description' property.
 * @description
 * Value Of:
 * - {@link additionalProperty}
 * - {@link identifier}
 * @see http://schema.org/PropertyValue
 * @typedef {StructuredValue} PropertyValue
 * @property {(boolean|number|string|StructuredValue)=} value The value of the quantitative value or property value node.
 */

/**
 * @summary A rating is an evaluation on a numeric scale, such as 1 to 5 stars.
 * @see http://schema.org/Rating
 * @typedef {Intangible} Rating
 * @property {(number|string)=} bestRating The highest value allowed in this rating system. If bestRating is omitted, 5 is assumed.
 * @property {(number|string)=} ratingValue The rating for the content.
 * @property {(number|string)=} worstRating The lowest value allowed in this rating system. If worstRating is omitted, 1 is assumed.
 */

/**
 * @summary Structured values are used when the value of a property has a more complex structure than simply being a textual value or a reference to another thing.
 * @description
 * Value Of:
 * - {@link value}
 * @see http://schema.org/StructuredValue
 * @typedef {Intangible} StructuredValue
 */

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
