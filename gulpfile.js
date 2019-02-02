const fs   = require('fs')
const path = require('path')
const url  = require('url')
const util = require('util')

const gulp  = require('gulp')
const typedoc    = require('gulp-typedoc')
const typescript = require('gulp-typescript')
const mkdirp = require('make-dir')
const Ajv   = require('ajv')
// require('typedoc')    // DO NOT REMOVE … peerDependency of `gulp-typedoc`
// require('typescript') // DO NOT REMOVE … peerDependency of `gulp-typescript`

const { requireJSON } = require('@chharvey/requirejson')

const tsconfig      = require('./tsconfig.json')
const typedocconfig = require('./config/typedoc.json')


gulp.task('validate', async function () {
	const sdo_jsd = require('./index.js')
	new Ajv()
		.addMetaSchema(await sdo_jsd.META_SCHEMATA)
		.addSchema(await sdo_jsd.JSONLD_SCHEMA)
		.addSchema(await sdo_jsd.SCHEMATA)
})

gulp.task('dist-index', async function() {
	return gulp.src('./src/{index,build}.ts')
		.pipe(typescript(tsconfig.compilerOptions))
		.pipe(gulp.dest('./dist/'))
})

gulp.task('dist-jsonld', ['validate'], async function () {
	const { SCHEMATA } = require('./dist/index.js')
	const { buildLD } = require('./dist/build.js')
	let contents = JSON.stringify(buildLD(await SCHEMATA), null, '\t')
  await mkdirp('./dist/')
	return util.promisify(fs.writeFile)('./dist/schemaorg.jsonld', contents, 'utf8')
})

gulp.task('dist-ts', ['dist-jsonld'], async function () {
	const { buildTS } = require('./dist/build.js')
	let contents = buildTS(await requireJSON('./dist/schemaorg.jsonld'))
	return util.promisify(fs.writeFile)('./dist/schemaorg.d.ts', contents, 'utf8')
})

gulp.task('dist', ['dist-index', 'dist-ts'], async function () {
  return gulp.src('./dist/schemaorg.d.ts')
    .pipe(typescript(tsconfig.compilerOptions))
    .pipe(gulp.dest('./dist/'))
})

gulp.task('test', async function () {
	const sdo_jsd = require('./index.js')
	return Promise.all((await util.promisify(fs.readdir)('./test')).map(async (file) => {
		let filepath = path.resolve(__dirname, './test/', file)
		let returned;
		try {
			returned = await sdo_jsd.sdoValidate(filepath)
			console.log(`The example ${file} is valid.`)
		} catch (e) {
			console.error(`The example ${file} failed!`, e.details || e)
		}
		return returned
	}))
})


gulp.task('docs', async function () {
  return gulp.src('./dist/schemaorg.d.ts')
    .pipe(typedoc(typedocconfig))
})

gulp.task('build', ['validate', 'dist', 'test', 'docs'])
