const fs   = require('fs')
const path = require('path')
const url  = require('url')
const util = require('util')

const gulp  = require('gulp')
const typedoc    = require('gulp-typedoc')
const typescript = require('gulp-typescript')
const Ajv   = require('ajv')
// require('typedoc')    // DO NOT REMOVE … peerDependency of `gulp-typedoc`
// require('typescript') // DO NOT REMOVE … peerDependency of `gulp-typescript`

const { requireJSON } = require('@chharvey/requirejson')

const tsconfig      = require('./tsconfig.json')
const typedocconfig = require('./config/typedoc.json')


async function validate() {
	const sdo_jsd = require('./index.js')
	new Ajv()
		.addMetaSchema(await sdo_jsd.META_SCHEMATA)
		.addSchema(await sdo_jsd.JSONLD_SCHEMA)
		.addSchema(await sdo_jsd.SCHEMATA)
}

function dist_index() {
	return gulp.src('./src/{index,build}.ts')
		.pipe(typescript(tsconfig.compilerOptions))
		.pipe(gulp.dest('./dist/'))
}

const dist = gulp.series(
	dist_index,
	async function dist0() {
		const { SCHEMATA } = require('./dist/index.js')
		const { buildLD, buildTS } = require('./dist/build.js')
		let ld = buildLD(await SCHEMATA)
		return Promise.all([
			util.promisify(fs.writeFile)('./dist/schemaorg.jsonld', JSON.stringify(ld, null, '\t'), 'utf8'),
			util.promisify(fs.writeFile)('./dist/schemaorg.d.ts', buildTS(ld), 'utf8'),
		])
	}
)

async function test() {
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
}

function docs() {
  return gulp.src('./dist/schemaorg.d.ts')
    .pipe(typedoc(typedocconfig))
}

const build = gulp.series(
	validate,
	dist,
	gulp.parallel(test, docs)
)

module.exports = {
	validate,
	dist_index,
	dist,
	test,
	docs,
	build,
}
