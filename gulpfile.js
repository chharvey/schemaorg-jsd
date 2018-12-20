const fs   = require('fs')
const path = require('path')
const url  = require('url')
const util = require('util')

const gulp  = require('gulp')
const typedoc    = require('gulp-typedoc')
const typescript = require('gulp-typescript')
const mkdirp = require('make-dir')
const Ajv   = require('ajv')
// require('typedoc')    // DO NOT REMOVE … peerDependency of `gulp-typedoc`
// require('typescript') // DO NOT REMOVE … peerDependency of `gulp-typescript`

const { requireJSONLDAsync } = require('./lib/requireJSONLD.js')

const tsconfig      = require('./tsconfig.json')
const typedocconfig = require('./config/typedoc.json')


gulp.task('validate', async function () {
	const sdo_jsd = require('./index.js')
  const [META_SCHEMATA, SCHEMATA] = await Promise.all([sdo_jsd.getMetaSchemata(), sdo_jsd.getSchemata()])
  new Ajv().addMetaSchema(META_SCHEMATA).addSchema(SCHEMATA)
})

gulp.task('dist-index', async function() {
	return gulp.src('./src/index.ts')
		.pipe(typescript(tsconfig.compilerOptions))
		.pipe(gulp.dest('./dist/'))
})

gulp.task('dist-jsonld', ['validate'], async function () {
	const sdo_jsd = require('./index.js')
  // ++++ LOCAL VARIABLES ++++
  const SCHEMATA = (await sdo_jsd.getSchemata())
    .filter((jsd) => path.parse(new url.URL(jsd['$id']).pathname).name !== 'json-ld') // TODO: reference json-ld.jsd externally
  let label     = (jsd) => path.parse(new url.URL(jsd.title).pathname).name
  let comment   = (jsd) => jsd.description
  let supertype = (jsd) => (label(jsd) !== 'Thing') ? path.parse(jsd.allOf[0].$ref).name : null

  // ++++ MAP TO JSON-LD ++++
  let datatypes = SCHEMATA.filter((jsd) => jsd.$schema === 'http://json-schema.org/draft-07/schema#').map((jsd) => ({
    '@type'        : 'rdfs:Datatype',
    '@id'          : `sdo:${label(jsd)}`,
    'rdfs:label'   : label(jsd),
    'rdfs:comment' : comment(jsd),
  }))
  let classes = SCHEMATA.filter((jsd) => jsd.$schema === 'https://chharvey.github.io/schemaorg-jsd/meta/type.jsd#').map((jsd) => ({
    '@type'           : 'rdfs:Class',
    '@id'             : `sdo:${label(jsd)}`,
    'rdfs:label'      : label(jsd),
    'rdfs:comment'    : comment(jsd),
    'rdfs:subClassOf' : (supertype(jsd)) ? { '@id': `sdo:${supertype(jsd)}` } : null,
    'superClassOf'    : [], // non-normative
    'rdfs:member'     : Object.entries(jsd.allOf[1].properties).map(function (entry) {
      let [key, value] = entry
      let memberjsd = SCHEMATA.find((j) => j.title===`http://schema.org/${key}`) || null
      if (memberjsd) return { '@id': `sdo:${key}` }
      else throw new ReferenceError(`No corresponding jsd file was found for member subschema \`${label(jsd)}#${key}\`.`)
    }),
    'valueOf': [], // non-normative
  }))
  let properties = SCHEMATA.filter((jsd) => jsd.$schema === 'https://chharvey.github.io/schemaorg-jsd/meta/member.jsd#').map((jsd) => ({
    '@type'        : 'rdf:Property',
    '@id'          : `sdo:${label(jsd)}`,
    'rdfs:label'   : label(jsd),
    'rdfs:comment' : comment(jsd),
    'rdfs:subPropertyOf': (jsd.allOf[0] !== true) ? { '@id': `sdo:${supertype(jsd).split('.')[0]}` } : null,
    'superPropertyOf': [], // non-normative
    'rdfs:domain'  : [], // non-normative
    '$rangeArray'  : jsd.allOf[1].anyOf.length >= 2, // non-standard
    'rdfs:range'   : (function (propertyschema) {
      const sdo_type = {
        'boolean': 'Boolean',
        'integer': 'Integer',
        'number' : 'Number' ,
        'string' : 'Text'   ,
      }
      // NOTE Cannot use `Array#map` here because there is not a 1-to-1 correspondance
      // between the schemata in `anyOf` and the pushed jsonld objects.
      // (Namely, if the jsd `"type"` property is an array, e.g. `["number", "string"]`.)
      const returned = []
      propertyschema.definitions['ExpectedType'].anyOf.forEach(function (schema) {
        if (schema.$ref) returned.push({ '@id': `sdo:${path.parse(schema.$ref).name}` })
        else {
          if (Array.isArray(schema.type)) returned.push(...schema.type.map((t) => ({ '@id': `sdo:${sdo_type[t]}` })))
          else returned.push({ '@id': `sdo:${sdo_type[schema.type]}` })
        }
      })
      return returned
    })(jsd),
  }))

  // ++++ PROCESS NON-NORMATIVE SCHEMA DATA ++++
  /*
   * Process non-normative subclasses.
   * Subclasses are non-normative because this information can be processed from each class’s superclass.
   */
  classes.forEach((jsonld) => {
    let superclass = jsonld['rdfs:subClassOf']
    let referenced = (superclass) ? classes.find((c) => c['@id'] === superclass['@id']) || null : null
    if (referenced) {
      referenced['superClassOf'].push({ '@id': jsonld['@id'] })
    }
  })
  /*
   * Process non-normative subproperties.
   * Subproperties are non-normative because this information can be processed from each property’s superproperty.
   */
  properties.forEach((jsonld) => {
    let superproperty = jsonld['rdfs:subPropertyOf']
    let referenced = (superproperty) ? properties.find((p) => p['@id'] === superproperty['@id']) || null : null
    if (referenced) {
      referenced['superPropertyOf'].push({ '@id': jsonld['@id'] })
    }
  })
  /*
   * Process non-normative `rdfs:domain`.
   * A property’s `rdfs:domain` is non-normative because this information can be processed from each type’s members.
   */
  classes.forEach((jsonld) => {
    jsonld['rdfs:member'].forEach(function (property) {
      let referenced = properties.find((m) => m['@id'] === property['@id']) || null
      if (referenced) {
        referenced['rdfs:domain'].push({ '@id': jsonld['@id'] })
      }
    })
  })
  /*
   * Process non-normative `valueOf`.
   * A class’s `valueOf` is non-normative because this information can be processed from each property’s `rdfs:range`.
   */
  properties.forEach((jsonld) => {
    jsonld['rdfs:range'].forEach(function (class_) {
      let referenced = classes.find((c) => c['@id'] === class_['@id']) || null
      if (referenced) {
        referenced['valueOf'].push({ '@id': jsonld['@id'] })
      }
    })
  })

  // ++++ DEFINE THE CONTENT TO WRITE ++++
  let contents = JSON.stringify({
    "@context": {
      "sdo" : "http://schema.org/",
      "rdf" : "https://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "superClassOf": { "@reverse": "rdfs:subClassOf" },
      "superPropertyOf": { "@reverse": "rdfs:subPropertyOf" },
      "valueOf"     : { "@reverse": "rdfs:range" }
    },
    "@graph": [
      ...datatypes,
      ...classes,
      ...properties,
    ],
  })

  // ++++ WRITE TO FILE ++++
  await mkdirp('./dist/')
  await util.promisify(fs.writeFile)('./dist/schemaorg.jsonld', contents)
})



gulp.task('dist-ts', ['dist-jsonld'], async function () {
	const JSONLD = (await requireJSONLDAsync(path.join(__dirname, './dist/schemaorg.jsonld')))['@graph']
  /**
   * @summary Print a list of links as a in jsdoc comment.
   * @private
   * @param   {!Object[]} objs array of JSON-LD objects
   * @returns {string} a segment of jsdoc/typescript comment
   */
  function linklist(objs) {
    return objs.map((obj) => ` * - {@link ${obj['@id'].split(':')[1]}}`).join('\n')
  }
  /**
   * @summary Convert a Schema.org Datatype to a TypeScript type alias.
   * @private
   * @param   {!Object} jsonld the JSON-LD object to mark up
   * @returns {string} TypeScript code
   */
  function datatypeTS(jsonld) {
    let alias = jsonld['rdfs:label']
    let type = ({
      'Boolean'  : 'boolean',
      'Date'     : 'string',
      'DateTime' : 'string',
      'Integer'  : 'number',
      'Number'   : 'number',
      'Text'     : 'string',
      'Time'     : 'string',
      'URL'      : 'string',
    })[alias]
    return `
      /**
       * @summary ${jsonld['rdfs:comment']}
       * @see http://schema.org/${jsonld['rdfs:label']}
       */
      export type ${alias} = ${type}
    `
  }
  /**
   * @summary Convert a Schema.org Class to a TypeScript interface.
   * @private
   * @param   {!Object} jsonld the JSON-LD object to mark up
   * @returns {string} TypeScript code
   */
  function classTS(jsonld) {
    return `
      /**
       * ${jsonld['rdfs:comment']}
       *
       * ${(jsonld['superClassOf'].length) ? `*(Non-Normative):* Known subclasses:\n${       linklist(jsonld['superClassOf'])}\n` : ''}
       * ${(jsonld['valueOf'     ].length) ? `*(Non-Normative):* May appear as values of:\n${linklist(jsonld['valueOf'     ]).replace(/}/g,'_type}')}\n` : ''}
       * @see http://schema.org/${jsonld['rdfs:label']}
       */
      export interface ${jsonld['rdfs:label']} ${(jsonld['rdfs:subClassOf']) ? `extends ${jsonld['rdfs:subClassOf']['@id'].split(':')[1]} ` : ''}{
        ${jsonld['rdfs:member'].map((member) => member['@id'].split(':')[1]).map((name) => `
          ${name}?: ${name}_type
        `).join('')}
      }
    `
  }
  /**
   * @summary Convert a Schema.org Property to a TypeScript type alias.
   * @private
   * @param   {!Object} jsonld the JSON-LD object to mark up
   * @returns {string} TypeScript code
   */
  function propertyTS(jsonld) {
    let rangeunion = `${jsonld['rdfs:range'].map((cls) => cls['@id'].split(':')[1]).join('|')}`
    return `
      /**
       * ${jsonld['rdfs:comment']}
       *
       * ${(jsonld['rdfs:subPropertyOf']) ? `Extends {@link ${jsonld['rdfs:subPropertyOf']['@id'].split(':')[1]}}` : ''}
       * ${(jsonld['superPropertyOf'].length) ? `*(Non-Normative):* Known subproperties:\n${linklist(jsonld['superPropertyOf'])}\n` : ''}
       * ${(jsonld['rdfs:domain'    ].length) ? `*(Non-Normative):* Property of:\n${        linklist(jsonld['rdfs:domain'    ])}\n` : ''}
       * @see http://schema.org/${jsonld['rdfs:label']}
       */
      type ${jsonld['rdfs:label']}_type = ${rangeunion}${(jsonld['$rangeArray']) ? `|(${rangeunion})[]` : ''}
    `
  }

  let contents = [
    ...JSONLD.filter((jsonld) => jsonld['@type'] === 'rdfs:Datatype').map(datatypeTS),
    ...JSONLD.filter((jsonld) => jsonld['@type'] === 'rdfs:Class'   ).map(classTS),
    ...JSONLD.filter((jsonld) => jsonld['@type'] === 'rdf:Property' ).map(propertyTS),
  ].join('')

  await util.promisify(fs.writeFile)('./dist/schemaorg.d.ts', contents)
})

gulp.task('dist', ['dist-ts'], async function () {
  return gulp.src('./dist/schemaorg.d.ts')
    .pipe(typescript(tsconfig.compilerOptions))
    .pipe(gulp.dest('./dist/'))
})

gulp.task('test', async function () {
	const sdo_jsd = require('./index.js')
	return Promise.all((await util.promisify(fs.readdir)('./test')).map(async (file) => {
		let filepath = path.resolve(__dirname, './test/', file)
		let returned;
		try {
			returned = await sdo_jsd.sdoValidate(filepath)
			console.log(`The example ${file} is valid.`)
		} catch (e) {
			console.error(`The example ${file} failed!`, e.details || e)
		}
		return returned
	}))
})


gulp.task('docs', async function () {
  return gulp.src('./dist/schemaorg.d.ts')
    .pipe(typedoc(typedocconfig))
})

gulp.task('build', ['validate', 'dist', 'test', 'docs'])
