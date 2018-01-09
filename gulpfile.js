const fs   = require('fs')
const path = require('path')

const gulp  = require('gulp')
const jsdoc = require('gulp-jsdoc3')

gulp.task('validate', function () {
  const Ajv = require('ajv')
  return fs.readdir('./schema/', 'utf8', function (err, files) {
    if (err) throw err
    files.forEach(function (file) {
      fs.readFile(path.join(__dirname, './schema/', file), 'utf8', function (err, data) {
        let ajv = new Ajv()
        let is_schema_valid = ajv.validateSchema(JSON.parse(data))
        if (!is_schema_valid) {
          console.error(`Invalid schema! ${file}`)
          console.error(ajv.errors)
        } else {
          console.log(`Valid schema: ${file}`)
        }
      })
    })
  })
})

// HOW-TO: https://github.com/mlucool/gulp-jsdoc3#usage
gulp.task('docs:api', function () {
  return gulp.src(['./README.md', './docs/src/*.js'], {read:false})
    .pipe(jsdoc(require('./jsdoc.config.json')))
})
