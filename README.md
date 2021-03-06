# [schemaorg-jsd](https://chharvey.github.io/schemaorg-jsd/docs/api/)
JSON Schema validation for JSON-LD files using Schema.org vocabulary.


# Usage

## Install
```
$ npm install schemaorg-jsd
```

## Validate Against Schema.org JSON Schema

This module exports an asynchronous validation function.
It returns a Promise object, so you may use `await` or you may use standard `Promise` prototype methods.
Read the TypeDoc comments in `./src/index.ts` for further details.

```js
const { sdoValidate } = require('schemaorg-jsd')

async function run() {
	// example 1: use any javascript object
	const school = {
		'@context': 'http://schema.org/',
		'@type': 'Place',
		name: `Blacksburg, ${usState('Virginia').code}`,
	}
	school['@id'] = 'http://www.blacksburg.gov/'
	try {
		const is_valid_place = sdoValidate(school, 'Place') // validate against the `Place` schema
		console.log(await is_valid_place) // return `true` if the document passes validation
	} catch (err) { // throw a `TypeError` if the document fails validation
		console.error(err)
		console.error(err.filename) // file where the invalidation occurred
		console.error(err.details) // more json-schema specifics; see <https://github.com/epoberezkin/ajv#validation-errors>
	}


	// example 2: require a package
	const me = require('./me.json')
	console.log(await sdoValidate(me, 'Person')) // return `true` if the document passes validation


	// example 3: use a string (relative path) of the filename
	const org = './my-org.jsonld'
	console.log(await sdoValidate(org, 'Organization')) // return `true` if the document passes validation


	// example 4: infer the schema from the `'@type'` property
	await sdoValidate(school) // validates against the `Place` schema, since `school['@type'] === 'Place'`


	// example 5: multiple types
	const business = {
		'@context': 'http://schema.org/',
		'@type': ['Place', 'LocalBusiness'],
	}
	await sdoValidate(business) // validates against all schemata in the array


	// example 6: default type is `Thing` (http://schema.org/Thing)
	await sdoValidate({
		'@context': 'http://schema.org/',
		'@type': 'foobar' // validates against the `Thing` schema, since value 'foobar' cannot be found
	})
	await sdoValidate({
		'@context': 'http://schema.org/',
		// validates against the `Thing` schema, since property '@type' is missing
	})


	// example 7: pass options object to Ajv constructor
	// (see https://github.com/ajv-validator/ajv/blob/master/docs/api.md#options)
	await sdoValiate(data, type, {
		strict: true,
	});
}
```


## Validate Against Your Own JSON Schema
You can use [ajv](https://www.npmjs.com/package/ajv) to validate any document against any JSON schema.
Normally you would do this by adding the schema to the ajv instance, and then checking the document.
However, if you write a schema that references one of this project’s Schema.org schema (via `$ref`),
you must add them both to the ajv instance.

Due to the interconnectedness of all Schema.org schemata, it’s faster to add them all at once.
This project’s exported `SCHEMATA` object is an array of Schema.org JSON schema,
pre-packaged and ready to add.
```js
const Ajv = require('ajv')
const sdo_jsd = require('schemaorg-jsd')

const my_schema = {
	"$schema": "http://json-schema.org/draft-07/schema#",
	"$id": "https://chharvey.github.io/example.jsd",
	"title": "Array<Thing>",
	"description": "An array of Schema.org Things.",
	"type": "array",
	"items": { "$ref": "https://chharvey.github.io/schemaorg-jsd/schema/Thing.jsd" }
}
const my_data = [
	{ "@context": "http://schema.org/", "@type": "Thing", "name": "Thing 1" },
	{ "@context": "http://schema.org/", "@type": "Thing", "name": "Thing 2" }
]

async function run() {
	const ajv = new Ajv()
		.addMetaSchema(await sdo_jsd.META_SCHEMATA)
		.addSchema(await sdo_jsd.JSONLD_SCHEMA)
		.addSchema(await sdo_jsd.SCHEMATA)
	ajv.validate(my_schema, my_data)
	/*
	Note that the `Ajv#validate()` method’s parameters are reversed from this package’s `sdoValidate()`:

	Ajv#validate(schema, data)     // schema comes before data
	sdoValidate(data, schemaTitle) // data comes before schema
	 */
}
```

## View the “API”
This project includes a set of [TypeDoc](http://typedoc.org/) declarations describing types and their properties.
They’re identical to the specs at [schema.org](https://schema.org/),
but you can import the source code in your own project for
[TypeScript](http://www.typescriptlang.org/) compilation.

[View the docs.](https://chharvey.github.io/schemaorg-jsd/docs/api/)

```ts
import * as sdo from 'schemaorg-jsd'

class Person {
	/** This person’s name. */
	private _name: string;
	/**
	 * Construct a new Person object.
	 * @param jsondata an object validating against the schemaorg-jsd `Person` schema
	 */
	constructor(jsondata: sdo.Person) {
		this._name = jsondata.name
	}
}
```


# Background Info

## JSON
[JSON](http://www.json.org/) (JavaScript Object Notation) is a data interchange format,
based off of the syntax used to define object literals in JavaScript.

## JSON Schema
[JSON Schema](http://json-schema.org/) is a subset of JSON
that allows you to validate JSON documents.
In other words, a particular JSON schema tells you whether your JSON instance file is written correctly,
if you choose to validate your instance against that schema.
JSON schema documents *themselves* must also be valid JSON, *as well as* validate against the
[JSON Meta-Schema specification](http://json-schema.org/draft-07/schema).
The JSON Meta-Schema tells you whether your JSON schema document, if you have one, is written correctly.
The official MIME Type of JSON schema documents is `application/schema+json`.

*Note: this project uses a `.jsd` (“JSON Schema Definition”) file extension to name JSON schema files, though
there is no prevailing convention on JSON schema file extensions.*

## JSON-LD
[JSON-LD](https://json-ld.org/) (JSON Linked Data) is a syntax used to mark up data in a consistent way.
Rather than everyone using their own data types, JSON-LD standardizes the markup, making it easy
for people and data types to communicate.
JSON-LD has some rules, for example, an object’s `@id` property must be a string.
Therefore, to enforce these rules, JSON-LD documents should validate against the
[JSON-LD Schema](https://json-ld.org/schemas/jsonld-schema.json).
The official MIME Type of JSON-LD documents is `application/ld+json`,
and JSON-LD files typically have file extension `.jsonld`.

## Schema.org
[Schema.org](https://schema.org/) Is a vocabulary that you can use to describe data.
These are semantic descriptions that have well-defined meanings.
For example, people using different human languages could refer to the unique identifier http://schema.org/givenName
and know precisely what others are talking about: a person’s given name.
The Schema.org vocabulary is syntax-agnostic, meaning you can use whatever format you want to mark up your data.
[Microdata](https://www.w3.org/TR/microdata/) is one common syntax, and JSON-LD is another.

## TypeScript
[TypeScript](https://www.typescriptlang.org/) is a strongly-typed language that compiles to JavaScript.
Some of the biggest features of TypeScript include *interfaces* and *type aliases*, which, respectively,
describe the “shape” (fields and methods) and “structure” (properties) that an object may have.
This project includes interfaces and type aliases for Schema.org Classes and Properties, respectively,
so that you can write a well-typed API for your project.

## Putting It All Together
You can semantically mark up your data using the Schema.org vocabulary with JSON-LD syntax.
If you have a TypeScript API, you can import this project’s TypeScript to catch any type errors before runtime.
Then, to prevent additional runtime errors or SEO mistakes, you can validate your markup against
the JSON schemata in this project.
