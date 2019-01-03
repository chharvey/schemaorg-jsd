import * as  fs   from 'fs'
import * as  path from 'path'
import * as  util from 'util'

import * as Ajv from 'ajv'

import { JSONSchemaObject } from '../lib/json-schema.d'
import { JSONLDObject } from '../lib/json-ld.d'
import { requireJSONAsync } from '../lib/requireJSON'


/**
 * An array of meta-schemata against which the content schemata validate.
 *
 * This is for internal use only. Users should not be expected to use these meta-schemata.
 * @returns an array of meta-schemata
 */
export async function getMetaSchemata(): Promise<JSONSchemaObject[]> {
  return Promise.all(
    (await util.promisify(fs.readdir)(path.resolve(__dirname, '../meta/')))
      .filter((filename) => path.parse(filename).ext === '.jsd')
      .map((filename) => requireJSONAsync(path.join(__dirname, '../meta/', filename)) as Promise<JSONSchemaObject>)
  )
}

/**
 * An array of all JSON Schemata validating Schema.org vocabulary.
 *
 * This array contains all Schema.org schemata in this project.
 * That is, schemata against which your JSON-LD documents should validate.
 * @returns an array of schemata
 */
export async function getSchemata(): Promise<JSONSchemaObject[]> {
  return Promise.all(
    (await util.promisify(fs.readdir)(path.resolve(__dirname, '../schema/')))
      .filter((filename) => path.parse(filename).ext === '.jsd')
      .map((filename) => requireJSONAsync(path.join(__dirname, '../schema/', filename)) as Promise<JSONSchemaObject>)
  )
}

/**
 * Validate a JSON-LD document against a Schema.org JSON schema.
 *
 * ```js
 * const { sdoValidate } = require('schemaorg-jsd')
 * async function compile(jsdoc) {
 * 	let is_valid;
 * 	try {
 * 		is_valid = await sdoValidate(jsdoc)
 * 	} catch (e) {
 * 		is_valid = false
 * 	}
 * 	console.log(is_valid)
 * }
 * // or you could use its Promise (if `async` keyword is not supported):
 * function compilePromise(jsdoc) {
 * 	sdoValidate(jsdoc)
 * 		.catch((e) => false)
 * 		.then((result) => { console.log(result) })
 * }
 * ```
 *
 * @param   document the JSON or JSON-LD object to test, or its path pointing to a `.json` or `.jsonld` file
 * @param   type the name of the Type to test against; should be a Class in http://schema.org/
 *               - see the API for supported Types
 *               - if omitted, will test against the JSON document’s `'@type'` property (if it has one)
 *               - if `'@type'` is an array, each value of that array is tested
 *               - if the `'@type'` is not supported or cannot be found, defaults to `'Thing'`
 * @returns does the document pass validation?
 * @throws  {TypeError} if the document fails validation; has a `.details` property for validation details
 */
export async function sdoValidate(document: JSONLDObject|string, type: string|null = null): Promise<true> {
	const META_SCHEMATA: Promise<JSONSchemaObject[]> = getMetaSchemata()
	const SCHEMATA     : Promise<JSONSchemaObject[]> = getSchemata()
	let doc: JSONLDObject = (typeof document === 'string') ? await requireJSONAsync(document) as JSONLDObject : document
	if (type === null) {
		let doctype: string[]|string|null = doc['@type'] || null
		if (doctype instanceof Array && doctype.length) {
			return (await Promise.all(doctype.map((dt) => sdoValidate(doc, dt)))).reduce((a, b) => a && b)
		} else if (typeof doctype === 'string') {
			type = ((await SCHEMATA).find((jsd) => jsd.title === `http://schema.org/${doctype}`)) ? doctype :
				(console.warn(`Class \`${doctype}\` is not yet supported. Validating against \`Thing.jsd\` instead…`), 'Thing')
		} else {
			console.warn(`JSON-LD \`@type\` property was not found. Validating against \`Thing.jsd\`…`)
			type = 'Thing'
		}
	}

	let ajv: Ajv.Ajv = new Ajv().addMetaSchema(await META_SCHEMATA).addSchema(await SCHEMATA)
	let is_data_valid: boolean = ajv.validate(`https://chharvey.github.io/schemaorg-jsd/schema/${type}.jsd`, doc) as boolean
	if (!is_data_valid) {
		let e: TypeError&{
			filename?: string;
			details?: Ajv.ErrorObject;
		} = new TypeError(`Document ${doc['@id'] || doc.identifier || doc.name || doc} does not valiate against schema ${type}.jsd!`)
		if (typeof document === 'string') e.filename = document
		e.details = ajv.errors ![0]
		throw e
	}
	return true
}
