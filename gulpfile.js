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
  let datatypes = SCHEMATA.DATATYPES.map((jsd) => new JSONSchemaDataType(jsd))
  let types     = SCHEMATA.TYPES    .map((jsd) => new JSONSchemaType    (jsd))
  let members   = SCHEMATA.MEMBERS  .map((jsd) => new JSONSchemaMember  (jsd))

  processSchemata(datatypes, types, members)

  let contents = JSON.stringify({
    '@context': {
      sdo : 'http://schema.org/',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema',
      superClassOf: { '@reverse': 'rdfs:subClassOf' },
    },
    '@graph': [
      ...types.map((type) => type.jsonld),
    ],
  })

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
