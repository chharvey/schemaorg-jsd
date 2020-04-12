import type {JSONSchema7, JSONSchema7Version} from 'json-schema'


/**
 * JSON Schema for a Schema.org Datatype.
 */
export interface SDODatatypeSchema extends JSONSchema7 {
	/**
	 * @override JSONSchema7
	 */
	$schema: JSONSchema7Version;
	/**
	 * @override JSONSchema7
	 * @format uri
	 */
	$id: string;
	/**
	 * The canonical URL of the Schema.org Datatype.
	 * @override JSONSchema7
	 * @format uri
	 */
	title: string;
	/**
	 * Schema.org’s canonical description of the Datatype.
	 * @override JSONSchema7
	 */
	description: string;
	/**
	 * @override JSONSchema7
	 */
	type: 'string'|'number'|'integer'|'boolean'|'null';
}

/**
 * JSON Schema for a Schema.org Class instance in JSON-LD.
 * @id https://chharvey.github.io/schemaorg-jsd/meta/type.jsd
 */
export interface SDOClassSchema extends JSONSchema7 {
	/**
	 * @override JSONSchema7
	 */
	$schema: 'https://chharvey.github.io/schemaorg-jsd/meta/type.jsd#';
	/**
	 * @override JSONSchema7
	 * @format uri
	 */
	$id: string;
	/**
	 * The canonical URL of the Schema.org Class.
	 * @override JSONSchema7
	 * @format uri
	 */
	title: string;
	/**
	 * Schema.org’s canonical description of the Class.
	 * @override JSONSchema7
	 */
	description: string;
	/**
	 * @override JSONSchema7
	 * @minItems 2
	 * @maxItems 2
	 */
	allOf: [
		/** The superclass of this class. */
		SingleReferenceSchema,
		/** An object having further properties of this class. */
		{
			type?: 'object',
			properties: {
				/** A reference to an external JSON schema for a Schema.org Property. */
				[key: string]: SingleReferenceSchema;
			}
		}
	];
}

/**
 * JSON Schema for a Schema.org Property instance in JSON-LD.
 * @id https://chharvey.github.io/schemaorg-jsd/meta/member.jsd
 */
export interface SDOPropertySchema extends JSONSchema7 {
	/**
	 * @override JSONSchema7
	 */
	$schema: 'https://chharvey.github.io/schemaorg-jsd/meta/member.jsd#';
	/**
	 * @override JSONSchema7
	 * @format uri
	 */
	$id: string;
	/**
	 * The canonical URL of the Schema.org Property.
	 * @override JSONSchema7
	 * @format uri
	 */
	title: string;
	/**
	 * Schema.org’s canonical description of the Property.
	 * @override JSONSchema7
	 */
	description: string;
	/**
	 * @override JSONSchema7
	 * @minItems 2
	 * @maxItems 2
	 */
	allOf: [
		/** The superproperty of this property, or: There is no superproperty of this property. */
		SingleReferenceSchema|true,
		/** References to the expected type(s) of this property. */
		{
			/**
			 * @override JSONSchema7
			 * @maxItems: 2
			 */
			anyOf: [
				{ $ref: '#/definitions/ExpectedType' }
			]|[
				{ $ref: '#/definitions/ExpectedType' },
				{ type: 'array', items: { $ref: '#/definitions/ExpectedType' } }
			];
		}
	];
	definitions: {
		/** The range of this property. */
		ExpectedType: {
			/** References to external JSON schema for Schema.org Classes. */
			anyOf: SingleReferenceSchema[];
		};
	};
}

/**
 * A single reference to a JSON schema.
 */
export type SingleReferenceSchema = {
	/**
	 * @format uri
	 */
	$ref: string;
}
