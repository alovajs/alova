/*
 * @Date: 2020-04-09 11:06:01
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2022-05-26 21:49:42
 */ 
// rollup.config.js
// umd
var { nodeResolve } = require('@rollup/plugin-node-resolve');
var commonjs = require('@rollup/plugin-commonjs');
var { terser } = require('rollup-plugin-terser');
var replace = require('@rollup/plugin-replace');
var json = require('@rollup/plugin-json');

var pkg = require('../package.json');
var common = require('./rollup.js');

var prod = process.env.NODE_ENV === 'production';

const globals = {};
// 将externals中的内容放到globals对象中
common.external.forEach(key => globals[key] = key);
module.exports = {
  input: 'src/index.ts',
  output: {
    file: prod ? 'dist/' + pkg.name + '.umd.min.js' : 'dist/' + pkg.name + '.umd.js',
    format: 'umd',
    // When export and export default are not used at the same time, set legacy to true.
    // legacy: true,
    name: common.name,
    globals,
    banner: common.banner,
  },
  external: common.external,
  plugins: [
    nodeResolve({
      browser: true,
      extensions: ['.ts', '.js', 'tsx', 'jsx']
    }),
    commonjs(),
    common.getCompiler(),
    json(),   // 可允许import json文件
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      preventAssignment: true,
    }),
    (prod && terser()),
  ]
};
