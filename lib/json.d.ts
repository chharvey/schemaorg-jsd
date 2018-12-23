/**
 * Any JSON value.
 */
type JSONValue = JSONObject|JSONArray|JSONPrimitive

/**
 * Any JSON object.
 */
interface JSONObject {
	[key: string]: JSONValue;
}

/**
 * Any JSON array.
 */
interface JSONArray extends Array<JSONValue> {
}

/**
 * Any non-object, non-array JSON value.
 */
type JSONPrimitive = string|number|boolean|null

export { JSONValue, JSONObject, JSONArray, JSONPrimitive }
