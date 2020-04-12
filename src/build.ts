import * as path from 'path'
import * as url from 'url'

import type {JSONSchema7} from 'json-schema'

import type {JSONLDDocument, JSONLDObject} from '@chharvey/requirejson'

import type {SDODatatypeSchema, SDOClassSchema, SDOPropertySchema} from './meta-schemata.d'
import type {SDODatatypeLD, SDOClassLD, SDOPropertyLD, SingleReferenceLD} from './meta-ld.d'


/**
 * Return a full JSON-LD document marking up the entire Schema.org vocabulary (supported).
 * @param   schemabase the codebase of all schemata to transform (all JSON Schemata for Schema.org vocab)
 * @returns a JSON-LD document for the all supported Schema.org vocabulary
 */
export function buildLD(schemabase: JSONSchema7[]): JSONLDDocument {
	/**
	 * Return the canonical name of the Schema.org item.
	 * @private
	 * @param   jsd A JSON Schema for a Schema.org Datatype, Class, or Property
	 * @returns the name of the datatype, class, or property
	 */
	function _label(jsd: SDODatatypeSchema|SDOClassSchema|SDOPropertySchema): string {
		return path.parse(new url.URL(jsd.title).pathname).name
	}

	/**
	 * Transform a Schema.org Datatype JSON Schema into a JSON-LD object.
	 * @param   jsd JSON Schema for a Schema.org Datatype
	 * @returns JSON-LD marking up the Schema.org Datatype
	 */
	function datatypeLD(jsd: SDODatatypeSchema): SDODatatypeLD {
		return {
			'@type'        : 'rdfs:Datatype',
			'@id'          : `sdo:${_label(jsd)}`,
			'rdfs:label'   : _label(jsd),
			'rdfs:comment' : jsd.description,
		}
	}

	/**
	 * Transform a Schema.org Class JSON Schema into a JSON-LD object.
	 * @param   jsd JSON Schema for a Schema.org Class
	 * @param   propertybase a base of Schema.org Properties to look up
	 * @returns JSON-LD marking up the Schema.org Class
	 */
	function classLD(jsd: SDOClassSchema, propertybase: ReadonlyArray<SDOPropertySchema>): SDOClassLD {
		function superclass(jsd: SDOClassSchema): string|null {
			return (_label(jsd) !== 'Thing') ? path.parse(jsd.allOf[0].$ref).name : null
		}
		return {
			'@type'           : 'rdfs:Class',
			'@id'             : `sdo:${_label(jsd)}`,
			'rdfs:label'      : _label(jsd),
			'rdfs:comment'    : jsd.description,
			'rdfs:subClassOf' : (superclass(jsd)) ? { '@id': `sdo:${superclass(jsd)}` } : null,
			'rdfs:member'     : Object.entries(jsd.allOf[1].properties).map((entry) => {
				let prop_name: string = entry[0]
				let memberjsd: SDOPropertySchema|null = propertybase.find((sch) => sch.title === `http://schema.org/${prop_name}`) || null
				if (memberjsd) return { '@id': `sdo:${prop_name}` }
				else throw new ReferenceError(`No corresponding jsd file was found for member subschema \`${_label(jsd)}#${prop_name}\`.`)
			}),
			superClassOf : [], // non-normative
			valueOf      : [], // non-normative
		}
	}

	/**
	 * Transform a Schema.org Property JSON Schema into a JSON-LD object.
	 * @param   jsd JSON Schema for a Schema.org Property
	 * @returns JSON-LD marking up the Schema.org Property
	 */
	function propertyLD(jsd: SDOPropertySchema): SDOPropertyLD {
		function superproperty(jsd: SDOPropertySchema): string|null {
			return (jsd.allOf[0] !== true) ? path.parse(jsd.allOf[0].$ref).name.split('.')[0] : null
		}
		return {
			'@type'              : 'rdf:Property',
			'@id'                : `sdo:${_label(jsd)}`,
			'rdfs:label'         : _label(jsd),
			'rdfs:comment'       : jsd.description,
			'rdfs:subPropertyOf' : (jsd.allOf[0] !== true) ? { '@id': `sdo:${superproperty(jsd)}` } : null,
			'rdfs:domain'        : [], // non-normative
			'rdfs:range'         : jsd.definitions.ExpectedType.anyOf.map((schema) => ({ '@id': `sdo:${path.parse(schema.$ref).name}` })),
			superPropertyOf      : [], // non-normative
			$rangeArray          : jsd.allOf[1].anyOf.length === 2, // non-standard
		}
	}

	/**
	 * Process non-normative subclasses.
	 *
	 * Subclasses are non-normative because this information can be processed from each class’s normative superclass.
	 */
	function processSubclasses(jsonld: SDOClassLD, classbase: ReadonlyArray<SDOClassLD>): void {
		let superclass: SingleReferenceLD|null = jsonld['rdfs:subClassOf']
		let referenced: SDOClassLD|null = (superclass) ? classbase.find((c) => c['@id'] === superclass !['@id']) || null : null
		if (referenced) {
			referenced.superClassOf.push({ '@id': jsonld['@id'] })
		}
	}

	/**
	 * Process non-normative subproperties.
	 *
	 * Subproperties are non-normative because this information can be processed from each property’s normative superproperty.
	 */
	function processSubproperties(jsonld: SDOPropertyLD, propertybase: ReadonlyArray<SDOPropertyLD>): void {
		let superproperty: SingleReferenceLD|null = jsonld['rdfs:subPropertyOf']
		let referenced: SDOPropertyLD|null = (superproperty) ? propertybase.find((p) => p['@id'] === superproperty !['@id']) || null : null
		if (referenced) {
			referenced.superPropertyOf.push({ '@id': jsonld['@id'] })
		}
	}

	/*
	 * Process non-normative `Property#rdfs:domain`.
	 *
	 * A property’s `rdfs:domain` is non-normative because this information can be processed from each class’s normative properties.
	 */
	function processDomains(jsonld: SDOClassLD, propertybase: ReadonlyArray<SDOPropertyLD>): void {
		jsonld['rdfs:member'].forEach((property_ref) => {
			let referenced: SDOPropertyLD|null = propertybase.find((p) => p['@id'] === property_ref['@id']) || null
			if (referenced) {
				referenced['rdfs:domain'].push({ '@id': jsonld['@id'] })
			}
		})
	}

	/*
	 * Process non-normative `Class#valueOf`.
	 *
	 * A class’s `valueOf` is non-normative because this information can be processed from each property’s normative `rdfs:range`.
	 */
	function processValueOf(jsonld: SDOPropertyLD, classbase: ReadonlyArray<SDOClassLD>): void {
		jsonld['rdfs:range'].forEach((class_ref) => {
			let referenced: SDOClassLD|null = classbase.find((c) => c['@id'] === class_ref['@id']) || null
			if (referenced) {
				referenced.valueOf.push({ '@id': jsonld['@id'] })
			}
		})
	}

	// All JSON schemata validating JSON-LD values marking up Schema.org Datatype, Class, and Property instances.
	const datatypeJSDs : ReadonlyArray<SDODatatypeSchema> = schemabase.filter((jsd) => jsd.$schema === 'http://json-schema.org/draft-07/schema#') as SDODatatypeSchema[]
	const classJSDs    : ReadonlyArray<SDOClassSchema>    = schemabase.filter((jsd) => jsd.$schema === 'https://chharvey.github.io/schemaorg-jsd/meta/type.jsd#') as SDOClassSchema[]
	const propertyJSDs : ReadonlyArray<SDOPropertySchema> = schemabase.filter((jsd) => jsd.$schema === 'https://chharvey.github.io/schemaorg-jsd/meta/member.jsd#') as SDOPropertySchema[]

	// JSON-LD objects marking up the Schema.org Datatypes, Classes, and Properties themselves
	const datatypeLDs : ReadonlyArray<SDODatatypeLD> = datatypeJSDs.map((jsd) => datatypeLD(jsd              ))
	const classLDs    : ReadonlyArray<SDOClassLD>    = classJSDs   .map((jsd) => classLD   (jsd, propertyJSDs))
	const propertyLDs : ReadonlyArray<SDOPropertyLD> = propertyJSDs.map((jsd) => propertyLD(jsd              ))

	classLDs.forEach((jsonld) => {
		processSubclasses(jsonld, classLDs)
		processDomains(jsonld, propertyLDs)
	})
	propertyLDs.forEach((jsonld) => {
		processSubproperties(jsonld, propertyLDs)
		processValueOf(jsonld, classLDs)
	})

	return {
		"@context": {
			"sdo" : "http://schema.org/",
			"rdf" : "https://www.w3.org/1999/02/22-rdf-syntax-ns#",
			"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
			"superClassOf"   : { "@reverse": "rdfs:subClassOf" },
			"superPropertyOf": { "@reverse": "rdfs:subPropertyOf" },
			"valueOf"        : { "@reverse": "rdfs:range" },
		},
		"@graph": [
			...datatypeLDs,
			...classLDs,
			...propertyLDs,
		],
	}
}

export function buildTS(jsonlddocument: JSONLDDocument): string {
	/**
	 * Print a list of links as a in jsdoc comment.
	 * @private
	 * @param   lds array of JSON-LD objects
	 * @returns a segment of jsdoc/typescript comment
	 */
	function _linklist(lds: ReadonlyArray<JSONLDObject>): string {
		return lds.map((obj) => ` * - {@link ${obj['@id'] !.split(':')[1]}}`).join('\n') // we know it will have an `'@id'` property
	}

	/**
	 * Transform a Schema.org Datatype JSON-LD object into a string in TypeScript.
	 * @param   ld JSON-LD for a Schema.org Datatype
	 * @returns a TypeScript type alias marking up the Schema.org Datatype
	 */
	function datatypeTS(ld: SDODatatypeLD): string {
		enum SDODatatypeNames {
			Boolean,
			Date,
			DateTime,
			Integer,
			Number,
			Text,
			Time,
			URL,
		}
		let alias: keyof typeof SDODatatypeNames = ld['rdfs:label'] as keyof typeof SDODatatypeNames
		let type: string = ({
			Boolean  : 'boolean',
			Date     : 'string',
			DateTime : 'string',
			Integer  : 'number',
			Number   : 'number',
			Text     : 'string',
			Time     : 'string',
			URL      : 'string',
		})[alias]
		return `
			/**
			 * ${ld['rdfs:comment']}
			 *
			 * @see http://schema.org/${ld['rdfs:label']}
			 */
			export type ${alias} = ${type}
		`
	}

	/**
	 * Transform a Schema.org Class JSON-LD object into a string in TypeScript.
	 * @param   ld JSON-LD for a Schema.org Class
	 * @returns a TypeScript interface marking up the Schema.org Class
	 */
	function classTS(ld: SDOClassLD): string {
		return `
			/**
			 * ${ld['rdfs:comment']}
			 *
			 * ${(ld['superClassOf'].length) ? `*(Non-Normative):* Known subclasses:\n${       _linklist(ld['superClassOf'])}\n` : ''}
			 * ${(ld['valueOf'     ].length) ? `*(Non-Normative):* May appear as values of:\n${_linklist(ld['valueOf'     ]).replace(/}/g,'_type}')}\n` : ''}
			 * @see http://schema.org/${ld['rdfs:label']}
			 */
			export interface ${ld['rdfs:label']} extends ${(ld['rdfs:subClassOf']) ? ld['rdfs:subClassOf']['@id'].split(':')[1] : 'JSONLDObject'} {
				${ld['rdfs:member'].map((member) => member['@id'].split(':')[1]).map((name) => `
					${name}?: ${name}_type
				`).join('')}
			}
		`
	}

	/**
	 * Transform a Schema.org Property JSON-LD object into a string in TypeScript.
	 * @param   ld JSON-LD for a Schema.org Property
	 * @returns a TypeScript type alias marking up the Schema.org Property
	 */
	function propertyTS(ld: SDOPropertyLD): string {
		let rangeunion: string = `${ld['rdfs:range'].map((cls) => cls['@id'].split(':')[1]).join('|')}`
		return `
			/**
			 * ${ld['rdfs:comment']}
			 *
			 * ${(ld['rdfs:subPropertyOf']) ? `Extends {@link ${ld['rdfs:subPropertyOf']['@id'].split(':')[1]}}` : ''}
			 * ${(ld['superPropertyOf'].length) ? `*(Non-Normative):* Known subproperties:\n${_linklist(ld['superPropertyOf'])}\n` : ''}
			 * ${(ld['rdfs:domain'    ].length) ? `*(Non-Normative):* Property of:\n${        _linklist(ld['rdfs:domain'    ])}\n` : ''}
			 * @see http://schema.org/${ld['rdfs:label']}
			 */
			type ${ld['rdfs:label']}_type = ${rangeunion}${(ld['$rangeArray']) ? `|(${rangeunion})[]` : ''}
		`
	}

	const JSONLD: ReadonlyArray<JSONLDObject> = jsonlddocument['@graph'] as JSONLDObject[]
	return [
		`import { JSONLDObject } from '@chharvey/requirejson'`,
		...JSONLD.filter((jsonld) => jsonld['@type'] === 'rdfs:Datatype').map((ld) => datatypeTS(ld as SDODatatypeLD)),
		...JSONLD.filter((jsonld) => jsonld['@type'] === 'rdfs:Class'   ).map((ld) => classTS   (ld as SDOClassLD   )),
		...JSONLD.filter((jsonld) => jsonld['@type'] === 'rdf:Property' ).map((ld) => propertyTS(ld as SDOPropertyLD)),
	].join('')
}


// function isSDODatatypeSchema(jsd: JSONSchema7): jsd is SDODatatypeSchema {
// 	return jsd.$schema === 'http://json-schema.org/draft-07/schema#'
// }
// function isSDOClassSchema(jsd: JSONSchema7): jsd is SDOClassSchema {
// 	return jsd.$schema === 'https://chharvey.github.io/schemaorg-jsd/meta/type.jsd#'
// }
// function isSDOPropertySchema(jsd: JSONSchema7): jsd is SDOPropertySchema {
// 	return jsd.$schema === 'https://chharvey.github.io/schemaorg-jsd/meta/member.jsd#'
// }
