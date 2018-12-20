/**
 * Any JSON value.
 */
export declare type JSONValue = JSONObject|JSONArray|JSONPrimitive

/**
 * Any JSON object.
 */
export declare interface JSONObject {
	[key: string]: JSONValue;
}

/**
 * Any JSON array.
 */
export declare interface JSONArray extends Array<JSONValue> {
}

/**
 * Any non-object, non-array JSON value.
 */
export declare type JSONPrimitive = string|number|boolean|null
