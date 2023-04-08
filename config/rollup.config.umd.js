/*
 * @Date: 2020-04-09 11:06:01
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2022-06-12 09:51:50
 */
// rollup.config.js
// umd
var { nodeResolve } = require('@rollup/plugin-node-resolve');
var commonjs = require('@rollup/plugin-commonjs');
var { terser } = require('rollup-plugin-terser');
var replace = require('@rollup/plugin-replace');
var json = require('@rollup/plugin-json');
var config = require('./rollup.js');
var prod = process.env.NODE_ENV === 'production';
var paths = config.compilePath;
var moduleType = prod ? 'umd.min' : 'umd';

module.exports = {
  input: paths.input,
  output: {
    name: paths.packageName,
    file: paths.output(moduleType),
    format: 'umd',
    // When export and export default are not used at the same time, set legacy to true.
    // legacy: true,
    globals: config.globals,
    banner: config.banner
  },
  external: config.external,
  plugins: [
    nodeResolve({
      browser: true,
      extensions: ['.ts', '.js', 'tsx', 'jsx']
    }),
    commonjs(),
    config.getCompiler(),
    json(), // 可允许import json文件
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      preventAssignment: true
    }),
    prod && terser()
  ]
};
