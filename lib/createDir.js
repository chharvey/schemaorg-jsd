const fs   = require('fs')
const path = require('path')
const util = require('util')

/**
 * @summary Test access of a directory; if error, make directory.
 * @param {string}  dir directory name to create; relative to `relativepath`
 * @param {string=} relativepath relative directory name, usually `__dirname`; defaults to `process.cwd()`
 */
module.exports = async function createDir(dir, relativepath = process.cwd()) {
  try       { await util.promisify(fs.access)(path.resolve(relativepath, dir)) }
  catch (e) { await util.promisify(fs.mkdir )(path.resolve(relativepath, dir)) }
}
