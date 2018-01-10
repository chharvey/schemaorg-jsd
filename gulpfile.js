const fs   = require('fs')
const path = require('path')

const gulp  = require('gulp')
const jsdoc = require('gulp-jsdoc3')
const Ajv = require('ajv')


function metaschema() {
  const http = require('http')
  return http.get('http://json-schema.org/draft-07/schema', function (res) {
    var data = []
    res.on('data', function (chunk) {
      data.push(chunk)
    })
    res.on('end', function () {
      fs.writeFile('meta.schema.json', data.join(''), 'utf8', function (err) {})
    })
  })
}

gulp.task('validate', function (callback) {
  fs.readdir('./schema/', 'utf8', function (err, files) {
    if (err) return callback.call(null, err)
    let count = valid = 0
    files.forEach(function (file) {
      count++
      fs.readFile(path.join(__dirname, './schema/', file), 'utf8', function (err, data) {
        try { JSON.parse(data) } catch (e) {
          e.filename = file
          callback.call(null, e)
          console.error(e)
          return
        }
        let ajv = new Ajv()
        let is_schema_valid = ajv.validateSchema(JSON.parse(data))
        if (!is_schema_valid) {
          let e = new TypeError(ajv.errors[0].message)
          e.filename = file
          e.details = ajv.errors[0]
          callback.call(null, e)
          console.error(e)
        } else {
          console.log(`Valid schema: ${file}`)
          valid++
        }
      })
    })
    return callback.call(null)
  })
})

gulp.task('validateSync', function () {
  let files = fs.readdirSync('./schema/', 'utf8')
  let count = valid = 0
  files.forEach(function (file) {
    count++
    let data = fs.readFileSync(path.join(__dirname, './schema/', file), 'utf8')
    try { JSON.parse(data) } catch (e) {
      e.filename = file
      console.error(e)
      return
    }
    let ajv = new Ajv()
    let is_schema_valid = ajv.validateSchema(JSON.parse(data))
    if (!is_schema_valid) {
      let e = new TypeError(ajv.errors[0].message)
      e.filename = file
      e.details = ajv.errors[0]
      console.error(e)
    } else {
      console.log(`Valid schema: ${file}`)
      valid++
    }
  })
  return console.info(`Total valid files: ${valid} out of ${count}.`)
})


// HOW-TO: https://github.com/mlucool/gulp-jsdoc3#usage
gulp.task('docs:api', function () {
  return gulp.src(['./README.md', './docs/src/*.js'], {read:false})
    .pipe(jsdoc(require('./jsdoc.config.json')))
})

gulp.task('build', ['validateSync', 'docs:api'])
