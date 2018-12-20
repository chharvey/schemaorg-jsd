import { JSONValue, JSONObject, JSONArray } from './json.d'
import { JSONSchema } from './json-schema.d'


/**
 * A single JSON-LD document.
 */
export declare interface JSONLDObject extends CommonObject {
	'@context'?: JSONObject|JSONArray|string|null;
	'@graph'?: { [key: string]: CommonObject; }|CommonObject[];
	[key: string]: any/*JSONValue*/;
}

declare interface CommonObject {
	/**
	 * @format uri
	 */
	'@id'?: string;
	'@value'?: string|number|boolean|null;
	'@language'?: string|null;
	'@type'?: string[]|string|null;
	'@container'?: '@language'|'@list'|'@index'|'@set'|null;
	'@list'?: unknown;
	'@set'?: unknown;
	'@reverse'?: { [key: string]: CommonObject; }|string|null;
	/**
	 * @format uri
	 */
	'@base'?: string|null;
	/**
	 * @format uri
	 */
	'@vocab'?: string|null;
	[key: string]: any/*CommonObject*/;
}
