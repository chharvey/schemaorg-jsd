import { JSONValue } from './json.d'


/**
 * Like node.js `require()`, but can be used on `.jsonld` files.
 * @param   filepath the relative path of the file to read
 * @returns a JSON value that is the result of parsing the file contents
 */
export declare function requireJSON(filepath: string): JSONValue;

/**
 * Asynchronous {@link requireJSONLD}.
 * @param   filepath the relative path of the file to read
 * @returns a JSON value that is the result of parsing the file contents
 */
export declare function requireJSONAsync(filepath: string): Promise<JSONValue>;
