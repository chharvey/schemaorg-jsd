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

/**
 * @summary Asynchronous {@link requireOther}.
 * @description Example: `requireOtherAsync('my-data.jsonld', function (err, data) { ... })`.
 * @param   {string} path the path of the file to read
 * @param   {Function} callback standard callback with `(err, data)` as the params
 * @returns {(string|number|boolean|?Object|Array|null)} the text of the file, parsed by JSON
 */
requireOther.async = function requireOtherAsync(path, callback) {
  let object;
  try {
    object = require(path)
  } catch (e) {
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) return callback.call(null, err, null)
      try {
        object = JSON.parse(data)
      } catch (e) {
        e.filename = path
        console.error(e)
        return callback.call(null, e, null)
      }
    })
  }
  return callback.call(null, null, object)
}

module.exports = requireOther
