/*
 * @Date: 2020-04-09 11:06:01
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2022-05-26 21:54:35
 */
var typescript = require('rollup-plugin-typescript2');
var pkg = require('../package.json');
var version = pkg.version;
var name = pkg.name;
var author = pkg.author;

var banner =
  `/*!
  * ${pkg.name} ${version} (https://github.com/${author}/${name})
  * API https://github.com/${author}/${name}/blob/master/doc/api.md
  * Copyright ${(new Date).getFullYear()} ${author}. All Rights Reserved
  * Licensed under MIT (https://github.com/${author}/${name}/blob/master/LICENSE)
  */
`;

const getCompiler = (opt = {
  // objectHashIgnoreUnknownHack: true,
  // clean: true,
  tsconfigOverride: {
    compilerOptions: {
      module: 'ES2015'
    }
  }
}) => typescript(opt);
exports.name = pkg.name;
exports.banner = banner;
exports.getCompiler = getCompiler;
exports.external = ['vue', 'react'];