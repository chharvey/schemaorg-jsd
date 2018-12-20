import { JSONValue, JSONArray } from './json.d'

/**
 * A single JSON Schema.
 */
export declare type JSONSchema = JSONSchemaObject|boolean

/**
 * A JSON Schema, if that schema is an object (not a boolean).
 */
declare interface JSONSchemaObject {
	/**
	 * @format 'uri-reference'
	 */
	$id?: string;
	/**
	 * @format 'uri'
	 */
	$schema?: string;
	/**
	 * @format 'uri-reference'
	 */
	$ref?: string;
	$comment?: string;
	title?: string;
	description?: string;
	default?: JSONValue;
	/**
	 * @default false
	 */
	readOnly?: boolean;
	examples?: JSONArray;
	/**
	 * @exclusiveMinimum 0
	 */
	multipleOf?: number;
	maximum?: number;
	exclusiveMaximum?: number;
	minimum?: number;
	exclusiveMinimum?: number;
	maxLength?: nonNegativeInteger;
	minLength?: nonNegativeIntegerDefault0;
	/**
	 * @format regex
	 */
	pattern?: string;
	additionalItems?: JSONSchema;
	/**
	 * @default true
	 */
	items?: JSONSchema|schemaArray;
	maxItems?: nonNegativeInteger;
	minItems?: nonNegativeIntegerDefault0;
	/**
	 * @default false
	 */
	uniqueItems?: boolean;
	contains?: JSONSchema;
	maxProperties?: nonNegativeInteger;
	minProperties?: nonNegativeIntegerDefault0;
	required?: stringArray;
	additionalProperties?: JSONSchema;
	/**
	 * @default {}
	 */
	definitions?: {
		[key: string]: JSONSchema;
	};
	/**
	 * @default {}
	 */
	properties?: {
		[key: string]: JSONSchema;
	};
	/**
	 * @default {}
	 */
	patternProperties?: {
		[
			/**
			 * @format regex
			 */
			key: string
		]: JSONSchema;
	},
	dependencies?: {
		[key: string]: JSONSchema|stringArray;
	},
	propertyNames?: JSONSchema;
	const?: JSONValue;
	/**
	 * @minItems 1
	 * @uniqueItems true
	 */
	enum?: JSONArray;
	/**
	 * @minItems 1
	 * @uniqueItems true
	 */
	type?: simpleTypes[]|simpleTypes;
	format?: string;
	contentMediaType?: string;
	contentEncoding?: string;
	if?: JSONSchema;
	then?: JSONSchema;
	else?: JSONSchema;
	allOf?: schemaArray;
	anyOf?: schemaArray;
	oneOf?: schemaArray;
	not?: JSONSchema;
}

/**
 * @minItems 1
 */
declare type schemaArray = JSONSchema[]


/**
 * @type integer
 */
declare type integer = number

/**
 * @type integer
 * @minimum 0
 */
declare type nonNegativeInteger = integer

/**
 * @type integer
 * @minimum 0
 * @default 0
 */
declare type nonNegativeIntegerDefault0 = integer

declare type simpleTypes = 'array'|'boolean'|'integer'|'null'|'number'|'object'|'string'

declare type stringArray = string[]
