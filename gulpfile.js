const fs   = require('fs')
const path = require('path')
const url  = require('url')
const util = require('util')

const gulp  = require('gulp')
const jsdoc = require('gulp-jsdoc3')
const Ajv   = require('ajv')

const {META_SCHEMATA, SCHEMATA, sdoValidate, sdoValidateSync} = require('./index.js')

const requireOther = require('./lib/requireOther.js')


gulp.task('validate', function () {
  new Ajv().addMetaSchema(META_SCHEMATA).addSchema(SCHEMATA)
})

gulp.task('test', function () {
  let filenames = fs.readdirSync('./test')
      filenames.forEach(function (file) {
        let filepath = path.join(__dirname, './test/', file)
        try {
          let passed = sdoValidateSync(filepath)
          console.log(`The example ${file} is valid.`)
        } catch (e) {
          console.error(`The example ${file} failed!`, e.details)
        }
      })
  // for (let file of filenames) {
  // }
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
        // 'sdo:domainIncludes': [{ '@id': `sdo:${label(jsd)}` }], // non-normative // commenting out because nested inside
        '$rangeIncludesArray': value.anyOf.length >= 2, // non-standard
        'sdo:rangeIncludes': (function () {
          const returned = []
          value.definitions.ExpectedType.anyOf.forEach(function (schema) {
            if (schema.$ref) returned.push({ '@id': `sdo:${path.parse(schema.$ref).name}`.replace(/#/g, label(jsd)) })
            else if (schema.type) {
              function sdoType(jsdType) {
                return ({
                  'boolean': 'Boolean',
                  'integer': 'Integer',
                  'number' : 'Number' ,
                  'string' : 'Text'   ,
                })[jsdType]
              }
              if (Array.isArray(schema.type)) returned.push(...schema.type.map((t) => ({ '@id': `sdo:${sdoType(t)}` })))
              else returned.push({ '@id': `sdo:${sdoType(schema.type)}` })
            }
          })
          return returned
        })(),
      }
    }),
    'valueOf': [], // non-normative
  }))
  let members = SCHEMATA.MEMBERS.map((jsd) => ({
    '@type'           : 'sdo:Property',
    '@id'             : `sdo:${label(jsd)}`,
    'sdo:name'        : label(jsd),
    'sdo:description' : comment(jsd),
    'sdo:domainIncludes': [], // non-normative
    '$rangeIncludesArray': jsd.anyOf.length >= 2, // non-standard
    'sdo:rangeIncludes': (function () {
      const returned = []
      jsd.definitions.ExpectedType.anyOf.forEach(function (schema) {
        if (schema.$ref) returned.push({ '@id': `sdo:${path.parse(schema.$ref).name}` })
        else if (schema.type) {
          function sdoType(jsdType) {
            return ({
              'boolean': 'Boolean',
              'integer': 'Integer',
              'number' : 'Number' ,
              'string' : 'Text'   ,
            })[jsdType]
          }
          if (Array.isArray(schema.type)) returned.push(...schema.type.map((t) => ({ '@id': `sdo:${sdoType(t)}` })))
          else returned.push({ '@id': `sdo:${sdoType(schema.type)}` })
        }
      })
      return returned
    })(),
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
   * Process non-normative `sdo:domainIncludes`.
   * A member’s `sdo:domainIncludes` is non-normative because this information can be processed from each type’s members.
   */
  types.forEach(function (jsonld) {
    jsonld['rdfs:member'].forEach(function (member) {
      let referenced = members.find((m) => m['@id'] === member['@id']) || null
      if (referenced) {
        referenced['sdo:domainIncludes'].push({ '@id': jsonld['@id'] })
      }
    })
  })
  /*
   * Process non-normative `valueOf`.
   * A type’s `valueOf` is non-normative because this information can be processed from each member’s `sdo:rangeIncludes`.
   */
  members.forEach(function (jsonld) {
    jsonld['sdo:rangeIncludes'].forEach(function (type) {
      let referenced = types.find((t) => t['@id'] === type['@id']) || null
      if (referenced) {
        referenced['valueOf'].push({ '@id': jsonld['@id'] })
      }
    })
  })
  // types.forEach(function (jsonld) {
  //   jsonld['rdfs:member'].forEach(function (member) {
  //     if (member['sdo:rangeIncludes']) { // if the member is nested in the class
  //       member['sdo:rangeIncludes'].forEach(function (type) {
  //         let referenced = types.find((t) => t['@id'] === type['@id']) || null
  //         if (referenced) {
  //           referenced['valueOf'].push({ '@id': member['@id'] })
  //         }
  //       })
  //     }
  //   })
  // })

  // ++++ DEFINE THE CONTENT TO WRITE ++++
  let contents = JSON.stringify({
    "@context": {
      "sdo" : "http://schema.org/",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "superClassOf": { "@reverse": "rdfs:subClassOf" },
      "valueOf"     : { "@reverse": "sdo:rangeIncludes" }
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

    function jsdocTypeDeclaration(member) {
      let union = `(${member['sdo:rangeIncludes'].map(function (ld) {
        let classname = ld['@id'].split(':')[1]
        function jsdType(sdoType) {
          return ({
            'Boolean': 'boolean',
            'Integer': 'integer',
            'Number' : 'number' ,
            'Text'   : 'string' ,
          })[sdoType]
        }
        return jsdType(classname) || classname
      }).join('|')})`
      return (member['$rangeIncludesArray']) ? `(${union}|Array<${union}>)` : union
    }

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
${(jsonld['superClassOf'].length || jsonld['valueOf'].length) ? ' * @description' : ''}
${(jsonld['superClassOf'].length) ? `
 * Known subtypes:
${jsonld['superClassOf'].map((obj) => ` * - {@link ${obj['@id'].split(':')[1]}}`).join('\n')}
` : ''}
${(jsonld['valueOf'].length) ? `
 * May appear as values of:
${jsonld['valueOf'].map((obj) => ` * - {@link ${obj['@id'].split(':')[1]}}`).join('\n')}
` : ''}
 * @see http://schema.org/${jsonld['sdo:name']}
 * @typedef {${(jsonld['rdfs:subClassOf']) ? jsonld['rdfs:subClassOf']['@id'].split(':')[1] : '!Object'}} ${jsonld['sdo:name']}
${jsonld['rdfs:member'].map(function (member) {
  let referenced = JSONLD.MEMBERS.find((m) => m['@id'] === member['@id']) || null
  let name        = (referenced || member)['sdo:name']
  let description = (referenced || member)['sdo:description']
  return ` * @property {${(referenced) ? name : jsdocTypeDeclaration(member)}=} ${name} ${description}`
}).join('\n')}
 */
    `)
    let members = JSONLD.MEMBERS.map((jsonld) => `
/**
 * @summary ${jsonld['sdo:description']}
${(jsonld['sdo:domainIncludes'] || false) ? ' * @description' : ''}
${(jsonld['sdo:domainIncludes'].length) ? `
 * Property of:
${jsonld['sdo:domainIncludes'].map((obj) => ` * - {@link ${obj['@id'].split(':')[1]}}`).join('\n')}
` : ''}
 * @see http://schema.org/${jsonld['sdo:name']}
 * @typedef {${jsdocTypeDeclaration(jsonld)}} ${jsonld['sdo:name']}
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

gulp.task('build', ['validate', 'test', 'docs:api'])
