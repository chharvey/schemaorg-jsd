const fs   = require('fs')
const path = require('path')
const url  = require('url')
const util = require('util')

const {requireOtherAsync} = require('./requireOther.js')



module.exports.getMetaSchemata = async function getMetaSchemata() {
  /**
   * @summary An array of meta-schemata against which the content schemata validate.
   * @description This is for internal use only. Users should not be expected to use these meta-schemata.
   * @alias module:index.META_SCHEMATA
   * @const {Array<!Object>}
   */
  return Promise.all(
    (await util.promisify(fs.readdir)(path.resolve(__dirname, '../meta/')))
      .filter((filename) => path.parse(filename).ext === '.jsd')
      .map((filename) => requireOtherAsync(path.resolve(__dirname, '../meta/', filename)))
  )
}

module.exports.getSchemata = async function getSchemata() {
  /**
   * @summary An array of all JSON Schemata validating Schema.org vocabulary.
   * @description This array contains all Schema.org schemata in this project.
   * That is, schemata against which your JSON-LD documents should validate.
   * @alias module:index.SCHEMATA
   * @const {Array<!Object>}
   */
  return Promise.all(
    (await util.promisify(fs.readdir)(path.resolve(__dirname, '../schema/')))
      .filter((filename) => path.parse(filename).ext === '.jsd')
      .map((filename) => requireOtherAsync(path.resolve(__dirname, '../schema/', filename)))
  )
}
