const index_module = require('./dist/index.js')

module.exports = {
	getMetaSchemata : index_module.getMetaSchemata,
	getSchemata     : index_module.getSchemata,
	sdoValidate     : index_module.sdoValidate,
}
