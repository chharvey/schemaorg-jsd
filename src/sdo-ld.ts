import * as path from 'path';
import * as url from 'url';

import type {
	NodeObject,
} from 'jsonld';

import type {
	SDODatatypeSchema,
	SDOClassSchema,
	SDOPropertySchema,
} from './meta-schemata.d';



/**
 * Return the canonical name of the Schema.org item.
 * @private
 * @param   jsd A JSON Schema for a Schema.org Datatype, Class, or Property
 * @returns the name of the datatype, class, or property
 */
function label(jsd: SDODatatypeSchema | SDOClassSchema | SDOPropertySchema): string {
	return path.parse(new url.URL(jsd.title).pathname).name;
}


abstract class SDO_LD implements NodeObject {
	readonly '@id':          NonNullable<NodeObject['@id']>;
	readonly 'rdfs:label':   string;
	readonly 'rdfs:comment': string;
	[K: string]:             NodeObject[keyof NodeObject];
	constructor (jsd: SDODatatypeSchema | SDOClassSchema | SDOPropertySchema) {
		this['@id']          = `sdo:${ label(jsd) }`;
		this['rdfs:label']   = label(jsd);
		this['rdfs:comment'] = jsd.description;
	}
}

/**
 * JSON-LD for a Schema.org Datatype.
 */
export class SDODatatypeLD extends SDO_LD {
	readonly '@type' = 'rdfs:Datatype';
	/**
	 * Transform a Schema.org Datatype JSON Schema into a JSON-LD object.
	 * @param   jsd JSON Schema for a Schema.org Datatype
	 * @returns JSON-LD marking up the Schema.org Datatype
	 */
	constructor (jsd: SDODatatypeSchema) {
		super(jsd);
	}
}

/**
 * JSON-LD for a Schema.org Class.
 */
export class SDOClassLD extends SDO_LD {
	readonly '@type' = 'rdfs:Class';
	readonly 'rdfs:subClassOf': SingleReferenceLD | null;
	readonly 'rdfs:member':     SingleReferenceLD[];
	/**
	 * Non-normative known subclasses of this class.
	 *
	 * Subclasses are non-normative because this information can be processed from each class’s superclass.
	 */
	readonly superClassOf: SingleReferenceLD[] = []; // non-normative
	/**
	 * Non-normative known properties of which an instance of this class could appear as a value.
	 *
	 * A class’s `valueOf` is non-normative because this information can be processed from each property’s `rdfs:range`.
	 */
	readonly valueOf: SingleReferenceLD[] = []; // non-normative
	/**
	 * Transform a Schema.org Class JSON Schema into a JSON-LD object.
	 * @param   jsd JSON Schema for a Schema.org Class
	 * @param   propertybase a base of Schema.org Properties to look up
	 * @returns JSON-LD marking up the Schema.org Class
	 */
	constructor (jsd: SDOClassSchema, propertybase: ReadonlyArray<SDOPropertySchema>) {
		super(jsd);
		this['rdfs:subClassOf'] = (label(jsd) !== 'Thing') ? {'@id': `sdo:${ path.parse(jsd.allOf[0].$ref).name }`} : null;
		this['rdfs:member']     = Object.entries(jsd.allOf[1].properties).map((entry) => {
			const prop_name: string = entry[0];
			return (propertybase.find((sch) => sch.title === `http://schema.org/${ prop_name }`))
				? {'@id': `sdo:${ prop_name }`}
				: (() => { throw new ReferenceError(`No corresponding jsd file was found for member subschema \`${ label(jsd) }#${ prop_name }\`.`) })()
			;
		});
	}
}

/**
 * JSON-LD for a Schema.org Property.
 */
export class SDOPropertyLD extends SDO_LD {
	readonly '@type' = 'rdf:Property';
	readonly 'rdfs:subPropertyOf': SingleReferenceLD|null;
	/**
	 * Non-normative classes that own this property as a member.
	 *
	 * A property’s `rdfs:domain` is non-normative because this information can be processed from each type’s members.
	 */
	readonly 'rdfs:domain': SingleReferenceLD[] = []; // non-normative
	readonly 'rdfs:range':  SingleReferenceLD[];
	/**
	 * Non-normative known subproperties of this property.
	 *
	 * Subproperties are non-normative because this information can be processed from each property’s superproperty.
	 */
	readonly superPropertyOf: SingleReferenceLD[] = []; // non-normative
	/**
	 * Non-standard: whether this property accepts multiple values.
	 */
	readonly $rangeArray: boolean; // non-standard
	/**
	 * Transform a Schema.org Property JSON Schema into a JSON-LD object.
	 * @param   jsd JSON Schema for a Schema.org Property
	 * @returns JSON-LD marking up the Schema.org Property
	 */
	constructor (jsd: SDOPropertySchema) {
		super(jsd);
		this['rdfs:subPropertyOf'] = (jsd.allOf[0] !== true) ? {'@id': `sdo:${ path.parse(jsd.allOf[0].$ref).name.split('.')[0] }`} : null;
		this['rdfs:range']         = jsd.definitions.ExpectedType.anyOf.map((schema) => ({'@id': `sdo:${ path.parse(schema.$ref).name }`}));
		this.$rangeArray           = jsd.allOf[1].anyOf.length === 2;
	}
}

/**
 * A single reference to a JSON-LD object.
 */
export type SingleReferenceLD = {
	'@id': string,
}
