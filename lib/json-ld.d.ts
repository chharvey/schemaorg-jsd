import { JSONValue, JSONObject, JSONArray } from './json.d'


/**
 * A single JSON-LD document.
 */
interface JSONLDObject extends CommonObject {
	'@context'?: (ContextObject|string)[]|ContextObject|string|null;
	'@graph'?: { [key: string]: CommonObject; }|CommonObject[];
	[key: string]: any/*CommonObject*/;
}

type ContextObject = {
	[key: string]: string|{
		'@id': string;
		'@type': '@id';
	}
}

interface CommonObject extends JSONObject {
	/**
	 * @format uri
	 */
	'@base'?: string|null;
	'@container'?: '@index'|'@list'|'@set'|null;
	/**
	 * @format uri
	 */
	'@id'?: string;
	'@language'?: string|null;
	'@list'?: JSONLDObject[];
	'@reverse'?: { [key: string]: CommonObject; }|string|null;
	'@set'?: JSONLDObject[];
	'@type'?: string[]|string|null;
	'@value'?: string|number|boolean|null;
	/**
	 * @format uri
	 */
	'@vocab'?: string|null;
	[key: string]: any/*CommonObject*/;
}

export { JSONLDObject }
