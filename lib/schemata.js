const fs   = require('fs')
const path = require('path')
const url  = require('url')
const util = require('util')

const {requireOtherAsync} = require('./requireOther.js')



async function getMetaSchemata() {
  /**
   * @summary An array of meta-schemata against which the content schemata validate.
   * @description This is for internal use only. Users should not be expected to use these meta-schemata.
   * @alias module:index.META_SCHEMATA
   * @const {Array<!Object>}
   */
  return Promise.all(
    (await util.promisify(fs.readdir)(path.resolve(__dirname, './meta/'), 'utf8'))
      .filter((filename) => path.parse(filename).ext === '.jsd')
      .map((filename) => requireOtherAsync(path.resolve(__dirname, './meta/', filename)))
  )
}

async function getSchemata() {
  /**
   * @summary An array of all JSON Schemata validating Schema.org vocabulary.
   * @description This array contains all Schema.org schemata in this project.
   * That is, schemata against which your JSON-LD documents should validate.
   * @alias module:index.SCHEMATA
   * @const {Array<!Object>}
   */
  return Promise.all(
    (await util.promisify(fs.readdir)(path.resolve(__dirname, './schema/'), 'utf8'))
      .filter((filename) => path.parse(filename).ext === '.jsd')
      .filter((jsd) => path.parse(new url.URL(jsd['$id']).pathname).name !== 'json-ld') // TODO: reference json-ld.jsd externally
      .map((filename) => requireOtherAsync(path.resolve(__dirname, './schema/', filename)))
  )
}

;(async function () {
  const [META_SCHEMATA, SCHEMATA] = await Promise.all([getMetaSchemata(), getSchemata()])
  module.exports = {META_SCHEMATA, SCHEMATA}
})()
