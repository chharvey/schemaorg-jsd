const index_module = require('./dist/index.js')

module.exports = {
	META_SCHEMATA : index_module.META_SCHEMATA,
	SCHEMATA      : index_module.SCHEMATA,
	sdoValidate   : index_module.sdoValidate,
}
