const fs   = require('fs')
const util = require('util')

module.exports.requireJSON = function requireJSON(filepath) {
	let data = fs.readFileSync(filepath, 'utf8')
	let object;
	try {
		object = JSON.parse(data)
	} catch (e) {
		e.filename = filepath
		console.error(e)
		throw e
	}
	return object
}

module.exports.requireJSONAsync = async function requireJSONAsync(filepath) {
	let data = await util.promisify(fs.readFile)(filepath, 'utf8')
	let object;
	try {
		object = JSON.parse(data)
	} catch (e) {
		e.filename = filepath
		console.error(e)
		throw e
	}
	return object
}
