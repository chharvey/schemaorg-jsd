const fs   = require('fs')
const path = require('path')
const url  = require('url')

const gulp  = require('gulp')
const jsdoc = require('gulp-jsdoc3')
const Ajv   = require('ajv')

const {META_SCHEMATA, SCHEMATA, sdoValidate} = require('./index.js')

const requireOther = require('./lib/requireOther.js')

const JSONSchemaDataType = require('./lib/JSONSchemaDataType.class.js')
const JSONSchemaType     = require('./lib/JSONSchemaType.class.js')
const JSONSchemaMember   = require('./lib/JSONSchemaMember.class.js')


/**
 * @summary Process non-normative schemata data.
 * @param   {Array<JSONSchemaDataType>} datatypes_array array of datatypes to process together
 * @param   {Array<JSONSchemaType>}     types_array     array of types     to process together
 * @param   {Array<JSONSchemaMember>}   members_array   array of members   to process together
 */
function processSchemata(datatypes_array, types_array, members_array) {
  /*
   * Process non-normative subtypes.
   * Subtypes are non-normative because this information can be processed from each type’s supertype.
   */
  types_array.forEach(function (obj) {
    let supertype_obj = types_array.find((t) => t.label===obj.supertype) || null
    return supertype_obj && supertype_obj.addSubtype(obj.label)
  })
}

gulp.task('validate', function () {
  new Ajv().addMetaSchema(META_SCHEMATA).addSchema(SCHEMATA)
})

gulp.task('test', function () {
  console.log(sdoValidate('./test.jsonld', 'Person'))
  console.log(sdoValidate(requireOther('./test.jsonld').alumniOf.location.address, 'PostalAddress'))
})

gulp.task('docs:jsonld', function (callback) {
  // ++++ LOCAL VARIABLES ++++
  let label     = (jsd) => path.parse(new url.URL(jsd.title).pathname).name
  let comment   = (jsd) => jsd.description
  let supertype = (jsd) => (label(jsd) !== 'Thing') ? path.parse(jsd.allOf[0].$ref).name : null

  // ++++ MAP TO JSON-LD ++++
  let datatypes = SCHEMATA.DATATYPES.map((jsd) => ({
    '@type'           : 'sdo:DataType',
    '@id'             : `sdo:${label(jsd)}`,
    'sdo:name'        : label(jsd),
    'sdo:description' : comment(jsd),
  }))
  let types = SCHEMATA.TYPES.map((jsd) => ({
    '@type'           : 'sdo:Class',
    '@id'             : `sdo:${label(jsd)}`,
    'sdo:name'        : label(jsd),
    'sdo:description' : comment(jsd),
    'rdfs:subClassOf' : (supertype(jsd)) ? { '@id': `sdo:${supertype(jsd)}` } : null,
    'superClassOf'    : [], // non-normative
    'rdfs:member'     : Object.entries(jsd.allOf[1].properties).map(function (entry) {
      let [key, value] = entry
      // Try finding the `*.prop.jsd` file first, else use the subschema in the `properties` object.
      let memberjsd = SCHEMATA.MEMBERS.find((j) => j.title===`http://schema.org/${key}`) || null
      if (memberjsd) return { '@id': `sdo:${key}` }
      return {
        '@type'           : 'sdo:Property',
        '@id'             : `sdo:${key}`,
        'sdo:name'        : key,
        'sdo:description' : value.description,
      }
    }),
  }))
  let members = SCHEMATA.MEMBERS.map((jsd) => ({
    '@type'           : 'sdo:Property',
    '@id'             : `sdo:${label(jsd)}`,
    'sdo:name'        : label(jsd),
    'sdo:description' : comment(jsd),
    'propertyOf'      : [], // non-normative
  }))

  // ++++ PROCESS NON-NORMATIVE SCHEMA DATA ++++
  /*
   * Process non-normative subtypes.
   * Subtypes are non-normative because this information can be processed from each type’s supertype.
   */
  types.forEach(function (jsonld) {
    let supertype = jsonld['rdfs:subClassOf']
    let referenced = (supertype) ? types.find((t) => t['@id'] === supertype['@id']) || null : null
    if (referenced) {
      referenced['superClassOf'].push({ '@id': jsonld['@id'] })
    }
  })
  /*
   * Process non-normative `propertyof`.
   * A property’s `propertyOf` is non-normative because this information can be processed from each type’s members.
   */
  types.forEach(function (jsonld) {
    jsonld['rdfs:member'].forEach(function (member) {
      let referenced = members.find((m) => m['@id'] === member['@id']) || null
      if (referenced) {
        referenced['propertyOf'].push({ '@id': jsonld['@id'] })
      }
    })
  })

  // ++++ DEFINE THE CONTENT TO WRITE ++++
  let contents = JSON.stringify({
    '@context': {
      sdo : 'http://schema.org/',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      superClassOf: { '@reverse': 'rdfs:subClassOf' },
      propertyOf  : { '@reverse': 'rdfs:member' },
    },
    '@graph': [
      ...datatypes,
      ...types,
      ...members,
    ],
  })

  // ++++ WRITE TO FILE ++++
  return fs.mkdir('./docs/build/', function (err) {
    fs.writeFile('./docs/build/schemaorg.jsonld', contents, 'utf8', callback) // send cb here to maintain dependency
  })
})

gulp.task('docs:typedef', ['docs:jsonld'], function (callback) {
  return fs.readFile('./docs/build/schemaorg.jsonld', 'utf8', function (err, data) {
    if (err) throw err
    data = JSON.parse(data)

    const JSONLD = {
      DATATYPES: data['@graph'].filter((jsonld) => jsonld['@type'] === 'sdo:DataType'),
      TYPES    : data['@graph'].filter((jsonld) => jsonld['@type'] === 'sdo:Class'   ),
      MEMBERS  : data['@graph'].filter((jsonld) => jsonld['@type'] === 'sdo:Property'),
    }

    let datatypes = JSONLD.DATATYPES.map((jsonld) => `
/**
 * @summary ${jsonld['sdo:description']}
 * @see http://schema.org/${jsonld['sdo:name']}
 * @typedef {*} ${jsonld['sdo:name']}
 */
    `)
    let types = JSONLD.TYPES.map((jsonld) => `
/**
 * @summary ${jsonld['sdo:description']}
${(jsonld['superClassOf'].length || false) ? ' * @description' : ''}
${(jsonld['superClassOf'].length) ? ' * Known subtypes:' : ''}
${jsonld['superClassOf'].map((obj) => ` * - {@link ${obj['@id'].split(':')[1]}}`).join('\n')}
 * @see http://schema.org/${jsonld['sdo:name']}
 * @typedef {${(jsonld['rdfs:subClassOf']) ? jsonld['rdfs:subClassOf']['@id'].split(':')[1] : '!Object'}} ${jsonld['sdo:name']}
${jsonld['rdfs:member'].map(function (member) {
  let referenced = JSONLD.MEMBERS.find((m) => m['@id'] === member['@id']) || null
  let name = (referenced || member)['sdo:name']
  let description = (referenced || member)['sdo:description']
  return ` * @property {${(referenced) ? name : '*'}=} ${name} ${description}` // TEMP until `rdfs:domain` and `rdfs:range` are encoded
}).join('\n')}
 */
    `)
    let members = JSONLD.MEMBERS.map((jsonld) => `
/**
 * @summary ${jsonld['sdo:description']}
 * @see http://schema.org/${jsonld['sdo:name']}
 * @typedef {*} ${jsonld['sdo:name']}
 */
    `) // TEMP until `rdfs:domain` and `rdfs:range` are encoded

    let contents = [
      ...datatypes,
      ...types,
      ...members,
    ].join('')

    fs.writeFile('./docs/build/typedef.js', contents, 'utf8', callback) // send cb here to maintain dependency
  })
})

// HOW-TO: https://github.com/mlucool/gulp-jsdoc3#usage
gulp.task('docs:api', ['docs:typedef'], function () {
  return gulp.src(['./README.md', './index.js', './docs/build/typedef.js'], {read:false})
    .pipe(jsdoc(require('./jsdoc.config.json')))
})

gulp.task('docs:api:private', function () {
  return gulp.src(['./lib/'], {read:false})
    .pipe(jsdoc(Object.assign({}, require('./jsdoc.config.json'), {
      "opts": {
        "destination": "./docs/api/private"
      },
      "templates": {
        "theme": "darkly"
      }
    })))
})

gulp.task('build', ['validate', 'test', 'docs:api', 'docs:api:private'])
