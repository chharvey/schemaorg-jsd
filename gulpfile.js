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

gulp.task('validate', function () {
  new Ajv().addMetaSchema(META_SCHEMATA).addSchema(SCHEMATA)
})

gulp.task('test', function () {
  console.log(sdoValidate('./test.jsonld', 'Person'))
  console.log(sdoValidate(requireOther('./test.jsonld').alumniOf.location.address, 'PostalAddress'))
})

gulp.task('docs:jsonld', function (callback) {
  const contents = `
{
  "@context": {
    "sdo": "http://schema.org/"
  },
  "@graph": [${SCHEMATA
    .filter((jsd) => path.parse(new url.URL(jsd['$id']).pathname).name !== 'json-ld') // TODO: reference json-ld.jsd externally
    .map((jsd) => JSON.stringify(new JSONSchema(jsd).jsonld))
    .join()}]
}
  `

  return fs.mkdir('./docs/build/', function (err) {
    fs.writeFile('./docs/build/schemaorg.jsonld', contents, 'utf8', callback) // send cb here to maintain dependency
  })
})

gulp.task('docs:api:compile', function (callback) {
  let contents = [
    SCHEMATA.DATATYPES.map((jsd) => new JSONSchemaDataType(jsd).jsdocTypedefTag).join(''),
    SCHEMATA.TYPES    .map((jsd) => new JSONSchemaType    (jsd).jsdocTypedefTag).join(''),
    SCHEMATA.MEMBERS  .map((jsd) => new JSONSchemaMember  (jsd).jsdocTypedefTag).join(''),
  ].join('')

  return fs.mkdir('./docs/build/', function (err) {
    fs.writeFile('./docs/build/typedef.js', contents, 'utf8', callback) // send cb here to maintain dependency
  })
})

// HOW-TO: https://github.com/mlucool/gulp-jsdoc3#usage
gulp.task('docs:api', ['docs:api:compile'], function () {
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
