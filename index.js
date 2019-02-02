const index_module = require('./dist/index.js')

module.exports = {
	META_SCHEMATA : index_module.META_SCHEMATA,
	JSONLD_SCHEMA : index_module.JSONLD_SCHEMA,
	SCHEMATA      : index_module.SCHEMATA,
	sdoValidate   : index_module.sdoValidate,
}
