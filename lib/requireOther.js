const fs   = require('fs')
const path = require('path')

/**
 * @summary Like node.js `require()`, but can be used on files other than `.js` or `.json`.
 * @description Example: `requireOther('my-data.jsonld')`.
 * @param   {string} path the path of the file to read
 * @returns {(string|number|boolean|?Object|Array|null)} the text of the file, parsed by JSON
 */
function requireOther(path) {
  let data, object;
  try {
    object = require(path)
  } catch (e) {
    try {
      data = fs.readFileSync(path, 'utf8')
    } catch (e) {
      throw e
    }
    try {
      object = JSON.parse(data)
    } catch (e) {
      e.filename = path
      console.error(e)
      throw e
    }
  }
  return object
}

module.exports = requireOther
