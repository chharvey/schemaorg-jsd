const gulp  = require('gulp')
const jsdoc = require('gulp-jsdoc3')


// HOW-TO: https://github.com/mlucool/gulp-jsdoc3#usage
gulp.task('docs:api', function () {
  return gulp.src(['./README.md', './docs/src/jsdoc.js'], {read:false})
    .pipe(jsdoc(require('./jsdoc.config.json')))
})
