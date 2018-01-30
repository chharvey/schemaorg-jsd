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
      let member = jsd.allOf[1].properties[key]
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
    let supertype_obj = (jsonld['rdfs:subClassOf']) ? types.find((t) => t['@id'] === jsonld['rdfs:subClassOf']['@id']) || null : null
    if (supertype_obj) {
      supertype_obj['superClassOf'].push({ '@id': jsonld['@id'] })
    }
  })
  /*
   * Process non-normative `propertyof`.
   * A property’s `propertyOf` is non-normative because this information can be processed from each type’s members.
   */
  types.forEach(function (jsonld) {
    jsonld['rdfs:member'].forEach(function (member) {
      let member_obj = members.find((m) => m['@id'] === member['@id']) || null
      if (member_obj) {
        member_obj['propertyOf'].push({ '@id': jsonld['@id'] })
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

gulp.task('docs:typedef', function (callback) {
  let datatypes = SCHEMATA.DATATYPES.map((jsd) => new JSONSchemaDataType(jsd))
  let types     = SCHEMATA.TYPES    .map((jsd) => new JSONSchemaType    (jsd))
  let members   = SCHEMATA.MEMBERS  .map((jsd) => new JSONSchemaMember  (jsd))

  processSchemata(datatypes, types, members)

  let contents = [
    datatypes.map((obj) => obj.jsdocTypedefTag).join(''),
    types    .map((obj) => obj.jsdocTypedefTag).join(''),
    members  .map((obj) => obj.jsdocTypedefTag).join(''),
  ].join('')

  return fs.mkdir('./docs/build/', function (err) {
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
