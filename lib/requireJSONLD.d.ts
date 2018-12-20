declare type JSONValue = JSONObject|JSONArray|JSONPrimitive
declare interface JSONObject {
	[key: string]: JSONValue;
}
declare interface JSONArray extends Array<JSONValue> {
}
declare type JSONPrimitive = string|number|boolean|null

/**
 * Like node.js `require()`, but can be used on `.jsonld` files.
 * @param   filepath the relative path of the file to read
 * @returns a JSON value that is the result of parsing the file contents
 */
declare function requireJSONLD(filepath: string): JSONValue;

/**
 * Asynchronous {@link requireJSONLD}.
 * @param   filepath the relative path of the file to read
 * @returns a JSON value that is the result of parsing the file contents
 */
declare function requireJSONLDAsync(filepath: string): Promise<JSONValue>;

export { requireJSONLD, requireJSONLDAsync }
