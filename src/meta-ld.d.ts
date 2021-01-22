import type {NodeObject} from 'jsonld';


interface SDO_LD extends NodeObject {
	'@id'          : string;
	'rdfs:label'   : string;
	'rdfs:comment' : string;
}

/**
 * JSON-LD for a Schema.org Datatype.
 */
export interface SDODatatypeLD extends SDO_LD {
	'@type': 'rdfs:Datatype';
}

/**
 * JSON-LD for a Schema.org Class.
 */
export interface SDOClassLD extends SDO_LD {
	'@type'           : 'rdfs:Class';
	'rdfs:subClassOf' : SingleReferenceLD|null;
	'rdfs:member'     : SingleReferenceLD[];
	/**
	 * Non-normative known subclasses of this class.
	 *
	 * Subclasses are non-normative because this information can be processed from each class’s superclass.
	 */
	superClassOf: SingleReferenceLD[];
	/**
	 * Non-normative known properties of which an instance of this class could appear as a value.
	 *
	 * A class’s `valueOf` is non-normative because this information can be processed from each property’s `rdfs:range`.
	 */
	valueOf: SingleReferenceLD[];
}

/**
 * JSON-LD for a Schema.org Property.
 */
export interface SDOPropertyLD extends SDO_LD {
	'@type'              : 'rdf:Property';
	'rdfs:subPropertyOf' : SingleReferenceLD|null;
	/**
	 * Non-normative classes that own this property as a member.
	 *
	 * A property’s `rdfs:domain` is non-normative because this information can be processed from each type’s members.
	 */
	'rdfs:domain' : SingleReferenceLD[];
	'rdfs:range'  : SingleReferenceLD[];
	/**
	 * Non-normative known subproperties of this property.
	 *
	 * Subproperties are non-normative because this information can be processed from each property’s superproperty.
	 */
	superPropertyOf: SingleReferenceLD[],
	/**
	 * Non-standard: whether this property accepts multiple values.
	 */
	$rangeArray: boolean,
}

/**
 * A single reference to a JSON-LD object.
 */
export type SingleReferenceLD = {
	'@id': string;
}
