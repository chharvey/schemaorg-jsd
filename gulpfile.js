const fs   = require('fs')
const path = require('path')

const gulp       = require('gulp')
const mocha      = require('gulp-mocha');
const typedoc    = require('gulp-typedoc')
const typescript = require('gulp-typescript')
const {default: Ajv} = require('ajv');
// require('ts-node')    // DO NOT REMOVE … peerDependency of `gulp-mocha`
// require('typedoc')    // DO NOT REMOVE … peerDependency of `gulp-typedoc`
// require('typescript') // DO NOT REMOVE … peerDependency of `gulp-typescript`

const tsconfig = require('./tsconfig.json')


function dist_index() {
	return gulp.src('./src/{index,build,sdo-ld}.ts')
		.pipe(typescript(tsconfig.compilerOptions))
		.pipe(gulp.dest('./dist/'))
}

async function validate() {
	const sdo_jsd = require('./index.js')
	new Ajv({
		strictTuples: false,
	})
		.addMetaSchema(await sdo_jsd.META_SCHEMATA)
		.addSchema(await sdo_jsd.JSONLD_SCHEMA)
		.addSchema(await sdo_jsd.SCHEMATA)
}

async function dist() {
	const { SCHEMATA } = require('./dist/index.js')
	const { buildLD, buildTS } = require('./dist/build.js')
	const ld = buildLD(await SCHEMATA)
	return Promise.all([
		fs.promises.writeFile('./dist/schemaorg.jsonld', JSON.stringify(ld, null, '\t'), 'utf8'),
		fs.promises.writeFile('./dist/schemaorg.d.ts', buildTS(ld), 'utf8'),
	])
}

function test() {
	return gulp.src('./test/**/*.ts')
		.pipe(mocha({
			require: 'ts-node/register',
		}))
	;
}

function docs() {
  return gulp.src('./dist/schemaorg.d.ts')
    .pipe(typedoc(tsconfig.typedocOptions))
}

const build = gulp.series(
	dist_index,
	validate,
	gulp.parallel(
		test,
		gulp.series(
			dist,
			docs,
		),
	),
);

module.exports = {
	build,
		dist_index,
		validate,
		test,
		dist,
		docs,
}
