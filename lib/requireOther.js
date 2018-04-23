const fs   = require('fs')
const path = require('path')
const util = require('util')

/**
 * @summary Like node.js `require()`, but can be used on files other than `.js` or `.json`.
 * @description Example: `requireOther('my-data.jsonld')`.
 * @param   {string} path the path of the file to read
 * @returns {(string|number|boolean|?Object|Array|null)} the text of the file, parsed by JSON
 */
function requireOther(path) {
  let object;
  try {
    object = require(path)
  } catch (e) {
    let data = fs.readFileSync(path, 'utf8')
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

/**
 * @summary asynchronous version of `requireOther`.
 * @param   {string} path the path of the file to read
 * @returns {(string|number|boolean|?Object|Array|null)} the text of the file, parsed by JSON
 */
async function requireOtherAsync(path) {
  let data = await util.promisify(fs.readFile)(path, 'utf8')
  let object;
  try {
    object = JSON.parse(data)
  } catch (e) {
    e.filename = path
    console.error(e)
    throw e
  }
  return object
}

module.exports = {requireOther,requireOtherAsync}
