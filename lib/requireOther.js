const fs   = require('fs')
const util = require('util')

/**
 * @summary Like node.js `require()`, but can be used on files other than `.js` or `.json`.
 * @description Example: `requireOther('my-data.jsonld')`.
 * @param   {string} filepath the path of the file to read
 * @returns {(string|number|boolean|?Object|Array|null)} the text of the file, parsed by JSON
 */
function requireOther(filepath) {
  let object;
  try {
    object = require(filepath)
  } catch (e) {
    let data = fs.readFileSync(filepath, 'utf8')
    try {
      object = JSON.parse(data)
    } catch (e) {
      e.filename = filepath
      console.error(e)
      throw e
    }
  }
  return object
}

/**
 * @summary asynchronous version of `requireOther`.
 * @param   {string} filepath the path of the file to read
 * @returns {(string|number|boolean|?Object|Array|null)} the text of the file, parsed by JSON
 */
async function requireOtherAsync(filepath) {
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

module.exports = {requireOther,requireOtherAsync}
