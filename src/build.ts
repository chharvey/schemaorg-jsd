import type {JSONSchema7} from 'json-schema'
import type {
	JsonLdDocument,
	NodeObject,
} from 'jsonld';

import type {SDODatatypeSchema, SDOClassSchema, SDOPropertySchema} from './meta-schemata.d'
import {
	SDO_LD,
	SDODatatypeLD,
	SDOClassLD,
	SDOPropertyLD,
	SingleReferenceLD,
} from './sdo-ld';


/**
 * Return a full JSON-LD document marking up the entire Schema.org vocabulary (supported).
 * @param   schemabase the codebase of all schemata to transform (all JSON Schemata for Schema.org vocab)
 * @returns a JSON-LD document for the all supported Schema.org vocabulary
 */
export function buildLD(schemabase: JSONSchema7[]): JsonLdDocument {
	/**
	 * Process non-normative subclasses.
	 *
	 * Subclasses are non-normative because this information can be processed from each class’s normative superclass.
	 */
	function processSubclasses(jsonld: SDOClassLD, classbase: ReadonlyArray<SDOClassLD>): void {
		const superclass: SingleReferenceLD|null = jsonld['rdfs:subClassOf']
		const referenced: SDOClassLD|null = superclass && classbase.find((c) => c['@id'] === superclass['@id']) || null
		if (referenced) {
			referenced.superClassOf.push({'@id': jsonld['@id']})
		}
	}

	/**
	 * Process non-normative subproperties.
	 *
	 * Subproperties are non-normative because this information can be processed from each property’s normative superproperty.
	 */
	function processSubproperties(jsonld: SDOPropertyLD, propertybase: ReadonlyArray<SDOPropertyLD>): void {
		const superproperty: SingleReferenceLD|null = jsonld['rdfs:subPropertyOf']
		const referenced: SDOPropertyLD|null = superproperty && propertybase.find((p) => p['@id'] === superproperty['@id']) || null
		if (referenced) {
			referenced.superPropertyOf.push({'@id': jsonld['@id']})
		}
	}

	/*
	 * Process non-normative `Property#rdfs:domain`.
	 *
	 * A property’s `rdfs:domain` is non-normative because this information can be processed from each class’s normative properties.
	 */
	function processDomains(jsonld: SDOClassLD, propertybase: ReadonlyArray<SDOPropertyLD>): void {
		jsonld['rdfs:member'].forEach((property_ref) => {
			const referenced: SDOPropertyLD|null = propertybase.find((p) => p['@id'] === property_ref['@id']) || null
			if (referenced) {
				referenced['rdfs:domain'].push({'@id': jsonld['@id']})
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
			const referenced: SDOClassLD|null = classbase.find((c) => c['@id'] === class_ref['@id']) || null
			if (referenced) {
				referenced.valueOf.push({'@id': jsonld['@id']})
			}
		})
	}

	// All JSON schemata validating JSON-LD values marking up Schema.org Datatype, Class, and Property instances.
	const datatypeJSDs: ReadonlyArray<SDODatatypeSchema> = schemabase.filter((jsd): jsd is SDODatatypeSchema => jsd.$schema === 'http://json-schema.org/draft-07/schema#');
	const classJSDs:    ReadonlyArray<SDOClassSchema>    = schemabase.filter((jsd): jsd is SDOClassSchema    => jsd.$schema === 'https://chharvey.github.io/schemaorg-jsd/meta/type.jsd#');
	const propertyJSDs: ReadonlyArray<SDOPropertySchema> = schemabase.filter((jsd): jsd is SDOPropertySchema => jsd.$schema === 'https://chharvey.github.io/schemaorg-jsd/meta/member.jsd#');

	// JSON-LD objects marking up the Schema.org Datatypes, Classes, and Properties themselves
	const datatypeLDs: ReadonlyArray<SDODatatypeLD> = datatypeJSDs.map((jsd) => new SDODatatypeLD(jsd));
	const classLDs:    ReadonlyArray<SDOClassLD>    = classJSDs   .map((jsd) => new SDOClassLD   (jsd, propertyJSDs));
	const propertyLDs: ReadonlyArray<SDOPropertyLD> = propertyJSDs.map((jsd) => new SDOPropertyLD(jsd));

	classLDs.forEach((jsonld) => {
		processSubclasses(jsonld, classLDs)
		processDomains(jsonld, propertyLDs)
	})
	propertyLDs.forEach((jsonld) => {
		processSubproperties(jsonld, propertyLDs)
		processValueOf(jsonld, classLDs)
	})

	return {
		'@context': {
			sdo  : 'http://schema.org/',
			rdf  : 'https://www.w3.org/1999/02/22-rdf-syntax-ns#',
			rdfs : 'http://www.w3.org/2000/01/rdf-schema#',
			superClassOf    : {'@reverse': 'rdfs:subClassOf'   },
			superPropertyOf : {'@reverse': 'rdfs:subPropertyOf'},
			valueOf         : {'@reverse': 'rdfs:range'        },
		},
		'@graph': [
			...datatypeLDs,
			...classLDs,
			...propertyLDs,
		],
	}
}

export function buildTS(jsonlddocument: JsonLdDocument): string {
	const JSONLD: ReadonlyArray<NodeObject> = '@graph' in jsonlddocument ? jsonlddocument['@graph'] as NodeObject[] : [];
	return [
		`import {NodeObject} from 'jsonld';`,
		...JSONLD.filter((jsonld): jsonld is SDODatatypeLD => jsonld['@type'] === 'rdfs:Datatype') .map((jsonld) => SDODatatypeLD .toTS(jsonld)),
		...JSONLD.filter((jsonld): jsonld is SDOClassLD    => jsonld['@type'] === 'rdfs:Class')    .map((jsonld) => SDOClassLD    .toTS(jsonld)),
		...JSONLD.filter((jsonld): jsonld is SDOPropertyLD => jsonld['@type'] === 'rdf:Property')  .map((jsonld) => SDOPropertyLD .toTS(jsonld)),
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
