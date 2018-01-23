const fs   = require('fs')
const path = require('path')
const url  = require('url')

const gulp  = require('gulp')
const jsdoc = require('gulp-jsdoc3')
const Ajv   = require('ajv')

const { SCHEMATA, sdoValidate } = require('./index.js')

const requireOther = require('./lib/requireOther.js')

gulp.task('validate', function () {
  new Ajv().addSchema(SCHEMATA)
})

gulp.task('test', function () {
  console.log(sdoValidate('./test.jsonld', 'Person'))
  console.log(sdoValidate(requireOther('./test.jsonld').alumniOf.location.address, 'PostalAddress'))
})


gulp.task('docs:api:compile', function (callback) {
  function jsDocType(jsonSchema) {
    return 'boolean'
  }

  const datatype_names = [
    'Date',
    'DateTime',
    'Time',
    'URL',
  ]

  let contents = [
    // datatypes
    SCHEMATA.filter(function (jsd) {
      let filename = path.parse(new url.URL(jsd['$id']).pathname).name
      return datatype_names.includes(filename)
    }).map(function (jsd) {
      let name = path.parse(new url.URL(jsd.title).pathname).name
      return `
/**
 * @summary ${jsd.description}
 * @see ${jsd.title}
 * @typedef {${jsDocType(jsd)}} ${name}
 */
      `
    }).join(''),

    // classes
    SCHEMATA.filter(function (jsd) {
      let filename = path.parse(new url.URL(jsd['$id']).pathname).name
      return filename[0] === filename[0].toUpperCase() && !datatype_names.includes(filename)
    }).map(function (jsd) {
      let name = path.parse(new url.URL(jsd.title).pathname).name
      let superclass = (name === 'Thing') ? `!Object` : path.parse(jsd.allOf[0]['$ref']).name
      return `
/**
 * @summary ${jsd.description}
 * @see ${jsd.title}
 * @typedef {${superclass}} ${name}
${Object.entries(jsd.allOf[1].properties).map((entry) =>
  ` * @property {${jsDocType(entry[1])}=} ${entry[0]} ${entry[1].description}`).join('\n')}
 */
      `
    }).join(''),

    // properties
    SCHEMATA.filter(function (jsd) {
      let filename = path.parse(new url.URL(jsd['$id']).pathname).name
      return filename[0] === filename[0].toLowerCase() && filename !== 'json-ld' // TODO: reference json-ld.jsd externally
    }).map(function (jsd) {
      let name = path.parse(new url.URL(jsd.title).pathname).name
      return `
/**
 * @summary ${jsd.description}
 * @see ${jsd.title}
 * @typedef {${jsDocType(jsd)}} ${name}
 */
      `
    }).join(''),
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


gulp.task('build', ['validate', 'test', 'docs:api'])
