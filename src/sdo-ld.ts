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

/**
 * Print a list of links as a in jsdoc comment.
 * @private
 * @param   lds array of JSON-LD objects
 * @returns a segment of jsdoc/typescript comment
 */
function linklist(lds: ReadonlyArray<NodeObject>): string {
	return lds.map((obj) => ` * - {@link ${ obj['@id']!.split(':')[1] }}`).join('\n'); // we know it will have an `'@id'` property
}



export abstract class SDO_LD implements NodeObject {
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
	/**
	 * Transform a Schema.org Datatype JSON-LD object into a string in TypeScript.
	 * @param datatypeLD the Schema.org Datatype JSON-LD to transform
	 * @returns a TypeScript type alias marking up the Schema.org Datatype
	 */
	static toTS(datatypeLD: SDODatatypeLD): string {
		return `
			/**
			 * ${ datatypeLD['rdfs:comment'] }
			 *
			 * @see http://schema.org/${ datatypeLD['rdfs:label'] }
			 */
			export type ${ datatypeLD['rdfs:label'] } = ${ new Map<string, string>([
				['Boolean',  'boolean'],
				['Date',     'string'],
				['DateTime', 'string'],
				['Integer',  'number'],
				['Number',   'number'],
				['Text',     'string'],
				['Time',     'string'],
				['URL',      'string'],
			]).get(datatypeLD['rdfs:label'])! };
		`.replace(/\n\t\t\t/g, '\n')
	}

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
	/**
	 * Transform a Schema.org Class JSON-LD object into a string in TypeScript.
	 * @param classLD the Schema.org Class JSON-LD to transform
	 * @returns a TypeScript interface marking up the Schema.org Class
	 */
	static toTS(classLD: SDOClassLD): string {
		return `
			/**
			 * ${ classLD['rdfs:comment'] }
			 *
			 * ${ (classLD['superClassOf'].length) ? `*(Non-Normative):* Known subclasses:\n${        linklist(classLD['superClassOf'])                         }\n` : '' }
			 * ${ (classLD['valueOf']     .length) ? `*(Non-Normative):* May appear as values of:\n${ linklist(classLD['valueOf'])     .replace(/}/g, '_type}') }\n` : '' }
			 * @see http://schema.org/${ classLD['rdfs:label'] }
			 */
			export interface ${ classLD['rdfs:label'] } extends ${ (classLD['rdfs:subClassOf']) ? classLD['rdfs:subClassOf']['@id'].split(':')[1] : 'NodeObject' } {
				${ classLD['rdfs:member'].map((member) => member['@id'].split(':')[1]).map((name) => `
					${ name }?: ${ name }_type;
				`.trim()).join('\n\t') }
			}
		`.replace(/\n\t\t\t/g, '\n');
	}

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
	/**
	 * Transform a Schema.org Property JSON-LD object into a string in TypeScript.
	 * @param classLD the Schema.org Property JSON-LD to transform
	 * @returns a TypeScript type alias marking up the Schema.org Property
	 */
	static toTS(propertyLD: SDOPropertyLD): string {
		const rangeunion: string = `${ propertyLD['rdfs:range'].map((cls) => cls['@id'].split(':')[1]).join(' | ') }`
		return `
			/**
			 * ${ propertyLD['rdfs:comment'] }
			 *
			 * ${ (propertyLD['rdfs:subPropertyOf']       ) ? `Extends {@link ${ propertyLD['rdfs:subPropertyOf']['@id'].split(':')[1] }}`              : '' }
			 * ${ (propertyLD['superPropertyOf']   .length) ? `*(Non-Normative):* Known subproperties:\n${ linklist(propertyLD['superPropertyOf']) }\n` : '' }
			 * ${ (propertyLD['rdfs:domain']       .length) ? `*(Non-Normative):* Property of:\n${         linklist(propertyLD['rdfs:domain'    ]) }\n` : '' }
			 * @see http://schema.org/${ propertyLD['rdfs:label'] }
			 */
			type ${ propertyLD['rdfs:label'] }_type = ${ rangeunion }${ (propertyLD['$rangeArray']) ? ` | (${ rangeunion })[]` : '' };
		`.replace(/\n\t\t\t/g, '\n')
	}

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
