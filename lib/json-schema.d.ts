import { JSONValue, JSONObject, JSONArray } from './json.d'

/**
 * A single JSON Schema.
 */
type JSONSchema = JSONSchemaObject|boolean

/**
 * A JSON Schema, if that schema is an object (not a boolean).
 */
interface JSONSchemaObject extends JSONObject {
	$comment?: string;
	/**
	 * @format 'uri-reference'
	 */
	$id?: string;
	/**
	 * @format 'uri-reference'
	 */
	$ref?: string;
	/**
	 * @format 'uri'
	 */
	$schema?: string;
	additionalItems?: JSONSchema;
	additionalProperties?: JSONSchema;
	allOf?: schemaArray;
	anyOf?: schemaArray;
	const?: JSONValue;
	contains?: JSONSchema;
	contentEncoding?: string;
	contentMediaType?: string;
	default?: JSONValue;
	/**
	 * @default {}
	 */
	definitions?: {
		[key: string]: JSONSchema;
	};
	dependencies?: {
		[key: string]: JSONSchema|stringArray;
	},
	description?: string;
	else?: JSONSchema;
	/**
	 * @minItems 1
	 * @uniqueItems true
	 */
	enum?: JSONArray;
	examples?: JSONArray;
	exclusiveMaximum?: number;
	exclusiveMinimum?: number;
	format?: string;
	if?: JSONSchema;
	/**
	 * @default true
	 */
	items?: JSONSchema|schemaArray;
	maximum?: number;
	maxItems?: nonNegativeInteger;
	maxLength?: nonNegativeInteger;
	maxProperties?: nonNegativeInteger;
	minimum?: number;
	minItems?: nonNegativeIntegerDefault0;
	minLength?: nonNegativeIntegerDefault0;
	minProperties?: nonNegativeIntegerDefault0;
	/**
	 * @exclusiveMinimum 0
	 */
	multipleOf?: number;
	not?: JSONSchema;
	oneOf?: schemaArray;
	/**
	 * @format regex
	 */
	pattern?: string;
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
	/**
	 * @default {}
	 */
	properties?: {
		[key: string]: JSONSchema;
	};
	propertyNames?: JSONSchema;
	/**
	 * @default false
	 */
	readOnly?: boolean;
	required?: stringArray;
	then?: JSONSchema;
	title?: string;
	/**
	 * @minItems 1
	 * @uniqueItems true
	 */
	type?: simpleTypes[]|simpleTypes;
	/**
	 * @default false
	 */
	uniqueItems?: boolean;
}

/**
 * @minItems 1
 */
type schemaArray = JSONSchema[]


/**
 * @type integer
 */
type integer = number

/**
 * @type integer
 * @minimum 0
 */
type nonNegativeInteger = integer

/**
 * @type integer
 * @minimum 0
 * @default 0
 */
type nonNegativeIntegerDefault0 = integer

type simpleTypes = 'array'|'boolean'|'integer'|'null'|'number'|'object'|'string'

/**
 * @uniqueItems true
 * @default []
 */
type stringArray = string[]

export { JSONSchema, JSONSchemaObject }
