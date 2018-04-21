const fs   = require('fs')
const path = require('path')
const url  = require('url')
const util = require('util')

const gulp  = require('gulp')
const jsdoc = require('gulp-jsdoc3')
const Ajv   = require('ajv')

const {META_SCHEMATA, SCHEMATA, sdoValidate, sdoValidateSync} = require('./index.js')

const createDir = require('./lib/createDir.js')
const requireOther = require('./lib/requireOther.js')


gulp.task('validate', function () {
  new Ajv().addMetaSchema(META_SCHEMATA).addSchema(SCHEMATA)
})

gulp.task('test', async function () {
  let filenames = fs.readdirSync('./test')
  await Promise.all(filenames.map(async function (file) {
    let filepath = path.resolve(__dirname, './test/', file)
      try {
        let passed = await sdoValidate(filepath)
        console.log(`The example ${file} is valid.`)
      } catch (e) {
        console.error(`The example ${file} failed!`, e.details || e)
      }
  }))
})

gulp.task('docs:jsonld', async function () {
  // ++++ LOCAL VARIABLES ++++
  let label     = (jsd) => path.parse(new url.URL(jsd.title).pathname).name
  let comment   = (jsd) => jsd.description
  let supertype = (jsd) => (label(jsd) !== 'Thing') ? path.parse(jsd.allOf[0].$ref).name : null

  /**
   * @summary Calculate the `sdo:rangeIncludes` attribute of a `Property` object.
   * @private
   * @param   {!Object} propertyschema a JSON schema validating the Property; must be valid against `member.jsd` or `member-subschema.jsd`
   * @returns {Array<'@id':string>} the Classes in this Property’s range---the possible types this property’s values may take
   */
  function rangeIncludesCalculator(propertyschema) {
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
  }

  // ++++ MAP TO JSON-LD ++++
  let datatypes = SCHEMATA.DATATYPES.map((jsd) => ({
    '@type'           : 'sdo:DataType',
    '@id'             : `sdo:${label(jsd)}`,
    'sdo:name'        : label(jsd),
    'sdo:description' : comment(jsd),
  }))
  let classes = SCHEMATA.TYPES.map((jsd) => ({
    '@type'           : 'sdo:Class',
    '@id'             : `sdo:${label(jsd)}`,
    'sdo:name'        : label(jsd),
    'sdo:description' : comment(jsd),
    'rdfs:subClassOf' : (supertype(jsd)) ? { '@id': `sdo:${supertype(jsd)}` } : null,
    'superClassOf'    : [], // non-normative
    'rdfs:member'     : Object.entries(jsd.allOf[1].properties).map(function (entry) {
      let [key, value] = entry
      let memberjsd = SCHEMATA.MEMBERS.find((j) => j.title===`http://schema.org/${key}`) || null
      if (memberjsd) return { '@id': `sdo:${key}` }
      else throw new ReferenceError(`No corresponding jsd file was found for member subschema \`${label(jsd)}#${key}\`.`)
    }),
    'valueOf': [], // non-normative
  }))
  let properties = SCHEMATA.MEMBERS.map((jsd) => ({
    '@type'           : 'sdo:Property',
    '@id'             : `sdo:${label(jsd)}`,
    'sdo:name'        : label(jsd),
    'sdo:description' : comment(jsd),
    'sdo:domainIncludes': [], // non-normative
    '$rangeIncludesArray': jsd.anyOf.length >= 2, // non-standard
    'sdo:rangeIncludes'  : rangeIncludesCalculator(jsd),
  }))

  // ++++ PROCESS NON-NORMATIVE SCHEMA DATA ++++
  /*
   * Process non-normative subclasses.
   * Subclasses are non-normative because this information can be processed from each class’s superclass.
   */
  classes.forEach(function (jsonld) {
    let superclass = jsonld['rdfs:subClassOf']
    let referenced = (superclass) ? classes.find((c) => c['@id'] === superclass['@id']) || null : null
    if (referenced) {
      referenced['superClassOf'].push({ '@id': jsonld['@id'] })
    }
  })
  /*
   * Process non-normative `sdo:domainIncludes`.
   * A property’s `sdo:domainIncludes` is non-normative because this information can be processed from each type’s members.
   */
  classes.forEach(function (jsonld) {
    jsonld['rdfs:member'].forEach(function (property) {
      let referenced = properties.find((m) => m['@id'] === property['@id']) || null
      if (referenced) {
        referenced['sdo:domainIncludes'].push({ '@id': jsonld['@id'] })
      }
    })
  })
  /*
   * Process non-normative `valueOf`.
   * A class’s `valueOf` is non-normative because this information can be processed from each property’s `sdo:rangeIncludes`.
   */
  properties.forEach(function (jsonld) {
    jsonld['sdo:rangeIncludes'].forEach(function (class_) {
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
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "superClassOf": { "@reverse": "rdfs:subClassOf" },
      "valueOf"     : { "@reverse": "sdo:rangeIncludes" }
    },
    '@graph': [
      ...datatypes,
      ...classes,
      ...properties,
    ],
  })

  // ++++ WRITE TO FILE ++++
  await createDir('./docs/build/')
  await util.promisify(fs.writeFile)('./docs/build/schemaorg.jsonld', contents, 'utf8')
})

gulp.task('docs:typedef', ['docs:jsonld'], async function () {
  let data = JSON.parse(await util.promisify(fs.readFile)('./docs/build/schemaorg.jsonld', 'utf8'))

  // REVIEW:INDENTATION
    function jsdocTypeDeclaration(member) {
      const jsd_type = {
        'Boolean': 'boolean',
        'Integer': 'integer',
        'Number' : 'number' ,
        'Text'   : 'string' ,
      }
      let union = `(${member['sdo:rangeIncludes'].map(function (ld) {
        let classname = ld['@id'].split(':')[1]
        return jsd_type[classname] || classname
      }).join('|')})`
      return (member['$rangeIncludesArray']) ? `(${union}|Array<${union}>)` : union
    }

    const JSONLD = {
      DATATYPES : data['@graph'].filter((jsonld) => jsonld['@type'] === 'sdo:DataType'),
      CLASSES   : data['@graph'].filter((jsonld) => jsonld['@type'] === 'sdo:Class'   ),
      PROPERTIES: data['@graph'].filter((jsonld) => jsonld['@type'] === 'sdo:Property'),
    }

    let datatypes = JSONLD.DATATYPES.map((jsonld) => `
      /**
       * @summary ${jsonld['sdo:description']}
       * @see http://schema.org/${jsonld['sdo:name']}
       * @typedef {*} ${jsonld['sdo:name']}
       */
    `)
    let classes = JSONLD.CLASSES.map((jsonld) => `
      /**
       * @summary ${jsonld['sdo:description']}
       * ${(jsonld['superClassOf'].length || jsonld['valueOf'].length) ? '@description' : ''}
       * ${(jsonld['superClassOf'].length) ? `*(Non-Normative):* Known subtypes:
      ${jsonld['superClassOf'].map((obj) => ` * - {@link ${obj['@id'].split(':')[1]}}`).join('\n')}` : ''}
       *
       * ${(jsonld['valueOf'].length) ? `*(Non-Normative):* May appear as values of:
      ${jsonld['valueOf'].map((obj) => ` * - {@link ${obj['@id'].split(':')[1]}}`).join('\n')}` : ''}
       *
       * @see http://schema.org/${jsonld['sdo:name']}
       * @typedef {${(jsonld['rdfs:subClassOf']) ? jsonld['rdfs:subClassOf']['@id'].split(':')[1] : '!Object'}} ${jsonld['sdo:name']}
      ${jsonld['rdfs:member'].map(function (member) {
        let referenced = JSONLD.PROPERTIES.find((m) => m['@id'] === member['@id']) || null
        let name        = (referenced || member)['sdo:name']
        let description = (referenced || member)['sdo:description']
        return ` * @property {${(referenced) ? name : jsdocTypeDeclaration(member)}=} ${name} ${description}`
      }).join('\n')}
       */
    `)
    let properties = JSONLD.PROPERTIES.map((jsonld) => `
      /**
       * @summary ${jsonld['sdo:description']}
       * ${(jsonld['sdo:domainIncludes'].length || false) ? '@description' : ''}
       *
       * ${(jsonld['sdo:domainIncludes'].length) ? `*(Non-Normative):* Property of:
      ${jsonld['sdo:domainIncludes'].map((obj) => ` * - {@link ${obj['@id'].split(':')[1]}}`).join('\n')}` : ''}
       *
       * @see http://schema.org/${jsonld['sdo:name']}
       * @typedef {${jsdocTypeDeclaration(jsonld)}} ${jsonld['sdo:name']}
       */
    `)

    let contents = [
      ...datatypes,
      ...classes,
      ...properties,
    ].join('')

  await util.promisify(fs.writeFile)('./docs/build/typedef.js', contents, 'utf8')
})

// HOW-TO: https://github.com/mlucool/gulp-jsdoc3#usage
gulp.task('docs:api', ['docs:typedef'], function () {
  return gulp.src(['./README.md', './index.js', './docs/build/typedef.js'], {read:false})
    .pipe(jsdoc(require('./jsdoc.config.json')))
})

gulp.task('build', ['validate', 'test', 'docs:api'])
