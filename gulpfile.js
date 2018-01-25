const fs   = require('fs')
const path = require('path')
const url  = require('url')

const gulp  = require('gulp')
const jsdoc = require('gulp-jsdoc3')
const Ajv   = require('ajv')

const {META_SCHEMATA, SCHEMATA, sdoValidate} = require('./index.js')

const requireOther = require('./lib/requireOther.js')
const JSONSchema   = require('./lib/JSONSchema.class.js')

gulp.task('validate', function () {
  new Ajv().addMetaSchema(META_SCHEMATA).addSchema(SCHEMATA)
})

gulp.task('test', function () {
  console.log(sdoValidate('./test.jsonld', 'Person'))
  console.log(sdoValidate(requireOther('./test.jsonld').alumniOf.location.address, 'PostalAddress'))
})


gulp.task('docs:api:compile', function (callback) {
  let contents = [
    { type: 'DataType', getter: 'jsdocDataDef'     },
    { type: 'Class'   , getter: 'jsdocTypeDef'     },
    { type: 'Property', getter: 'jsdocPropertyDef' },
  ].map((specs) => SCHEMATA
    .filter((jsd) => path.parse(new url.URL(jsd['$id']).pathname).name !== 'json-ld') // TODO: reference json-ld.jsd externally
    .filter((jsd) => JSONSchema.SCHEMA_TYPE[jsd.$schema] === specs.type)
    .map((jsd) => new JSONSchema(jsd)[specs.getter])
    .join('')
  ).join('')

  return fs.mkdir('./docs/build/', function (err) {
    fs.writeFile('./docs/build/typedef.js', contents, 'utf8', callback) // send cb here to maintain dependency
  })
})

// HOW-TO: https://github.com/mlucool/gulp-jsdoc3#usage
gulp.task('docs:api', ['docs:api:compile'], function () {
  return gulp.src(['./README.md', './index.js', './docs/build/typedef.js'], {read:false})
    .pipe(jsdoc(require('./jsdoc.config.json')))
})


gulp.task('build', ['validate', 'test', 'docs:api'])
