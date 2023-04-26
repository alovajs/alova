/*
 * @Date: 2020-04-09 11:06:01
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2022-06-12 09:51:50
 */
// rollup.config.js
// umd
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { terser } = require('rollup-plugin-terser');
const replace = require('@rollup/plugin-replace');
const json = require('@rollup/plugin-json');
const config = require('./rollup.cjs');
const prod = process.env.NODE_ENV === 'production';
const paths = config.compilePath;
const moduleType = prod ? 'umd.min' : 'umd';

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
