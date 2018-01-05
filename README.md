# schemaorg-jsd
JSON Schema validation for JSON-LD files using Schema.org vocabulary.


## JSON Schema
[JSON Schema](http://json-schema.org/) is a vocabulary, in JSON format, that allows you to validate JSON documents.
In other words, a particular JSON schema tells you whether your JSON instance file is written correctly, if you choose to validate your instance against that schema.
JSON schema documents *themselves* must also be valid JSON, *as well as* validate against the [JSON Meta-Schema specification](http://json-schema.org/draft-07/schema).
The JSON Meta-Schema tells you whether your JSON schema document, if you have one, is written correctly.
The official MIME Type of JSON schema documents is `application/schema+json`.

*Note: this project uses a `.jsd` (“JSON Schema Definition”) file extension to name JSON schema files, though
there is no prevailing convention on JSON schema file extensions.*

## JSON-LD
[JSON-LD](https://json-ld.org/) (JSON Linked Data) is a syntax used to mark up data in a consistent way.
Rather than everyone using their own data types, JSON-LD standardizes the markup, making it easy for people and data types to communicate.
JSON-LD has some rules, for example, an object’s `@id` property must be a string.
Therefore, to enforce these rules, JSON-LD documents should validate against the [JSON-LD Schema](https://raw.githubusercontent.com/json-ld/json-ld.org/master/schemas/jsonld-schema.json).
The official MIME Type of JSON-LD documents is `application/ld+json`,
and JSON-LD files typically have file extension `.jsonld`.

## Schema.org
[Schema.org](https://schema.org/) Is a vocabulary that you can use to describe data.
These are semantic descriptions that have well-defined meanings.
For example, people using different human languages could refer to the unique identifier http://schema.org/givenName and know precisely what others are talking about: a person’s given name.
The Schema.org vocabulary is syntax-agnostic, meaning you can use whatever format you want to mark up your data. [Microdata](https://www.w3.org/TR/microdata/) is one common syntax, and JSON-LD is another.

## Putting It All Together
You can semantically mark up your data using the Schema.org vocabulary with JSON-LD syntax.
Then, to prevent runtime errors or SEO mistakes, you can validate your markup against the JSON schemata (multiple “schemas”) in this project.
