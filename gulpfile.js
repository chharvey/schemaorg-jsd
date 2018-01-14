const fs   = require('fs')
const path = require('path')

const gulp  = require('gulp')
const jsdoc = require('gulp-jsdoc3')
const Ajv   = require('ajv')

const { SCHEMATA, sdoValidate } = require('./index.js')


gulp.task('validate', function () {
  new Ajv().addSchema(SCHEMATA)
})

gulp.task('test', function () {
  console.log(sdoValidate('./test.jsonld', 'Person'))
})


// HOW-TO: https://github.com/mlucool/gulp-jsdoc3#usage
gulp.task('docs:api', function () {
  return gulp.src(['./README.md', './index.js', './docs/src/*.js'], {read:false})
    .pipe(jsdoc(require('./jsdoc.config.json')))
})


gulp.task('build', ['validate', 'docs:api'])
