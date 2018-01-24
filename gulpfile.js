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

  /**
   * @summary Return the JSDoc-style type of a JSON Schema object.
   * @param   {(!Object|boolean)} jsonSchema a JSON Schema object
   * @returns {string} a JSDoc type description as a string, e.g., `'(boolean|number|string)'`
   */
  function jsDocType(jsonSchema) {
    if (jsonSchema.$ref) {
      return jsonSchema.$ref.split('.')[0]
    } else if (jsonSchema.allOf) {
      return jsDocType(jsonSchema.allOf[0])
    } else if (jsonSchema.anyOf) {
      return `(${jsonSchema.anyOf.map(jsDocType).join('|')})`
    } else if (jsonSchema.type) {
      if (Array.isArray(jsonSchema.type)) return `(${jsonSchema.type.join('|')})`.replace('array','Array').replace('object','!Object')
      else return jsonSchema.type.replace('array','Array').replace('object','!Object')
    } else {
    return 'boolean'
    }
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
      let name = path.parse(new url.URL(jsd['$id']).pathname).name
      return datatype_names.includes(name)
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
      let name = path.parse(new url.URL(jsd['$id']).pathname).name
      return name[0] === name[0].toUpperCase() && !datatype_names.includes(name)
    }).map(function (jsd) {
      let name = path.parse(new url.URL(jsd.title).pathname).name
      let superclass = (name === 'Thing') ? `!Object` : path.parse(jsd.allOf[0]['$ref']).name
      let properties = Object.entries(jsd.allOf[1].properties).map(function (entry) {
        // Try finding the `*.prop.jsd` file first, else use the `entry[1]` object.
        let propSchema = SCHEMATA.find((jsd) => jsd.title===`http://schema.org/${entry[0]}`) || entry[1]
        let type = jsDocType(propSchema)
        return ` * @property {${type.replace(/#/g, name)}=} ${entry[0]} ${propSchema.description}`
      })
      return `
/**
 * @summary ${jsd.description}
 * @see ${jsd.title}
 * @typedef {${superclass}} ${name}
${properties.join('\n')}
 */
      `
    }).join(''),

    // properties
    SCHEMATA.filter(function (jsd) {
      let name = path.parse(new url.URL(jsd['$id']).pathname).name
      return name[0] === name[0].toLowerCase() && name !== 'json-ld' // TODO: reference json-ld.jsd externally
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
