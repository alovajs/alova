/*
 * @Date: 2020-04-09 11:06:01
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2022-08-20 11:50:49
 */
var typescript = require('rollup-plugin-typescript2');
var pkg = require('../package.json');
var version = pkg.version;
var name = pkg.name;
var author = pkg.author;

var banner =
  `/**
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
exports.banner = banner;
exports.getCompiler = getCompiler;
const compilePaths = {
  core: {
    packageName: pkg.name,
    input: 'src/index.ts',
    output: suffix => `dist/${pkg.name}.${suffix}.js`,
  },
  vue: {
    packageName: 'VueHook',
    input: 'src/predefine/VueHook.ts',
    output: suffix => `dist/hooks/vuehook.${suffix}.js`,
  },
  react: {
    packageName: 'ReactHook',
    input: 'src/predefine/ReactHook.ts',
    output: suffix => `dist/hooks/reacthook.${suffix}.js`,
  },
  svelte: {
    extraExternal: ['svelte/store'],
    packageName: 'SvelteHook',
    input: 'src/predefine/SvelteHook.ts',
    output: suffix => `dist/hooks/sveltehook.${suffix}.js`,
  },
  globalFetch: {
    extraExternal: [],
    packageName: 'GlobalFetch',
    input: 'src/predefine/GlobalFetch.ts',
    output: suffix => `dist/adapter/globalfetch.${suffix}.js`,
  }
};
exports.external = Object.keys(compilePaths)
  .reduce((prev, next) => [
    ...prev,
    next,
    ...(compilePaths[next].extraExternal || [])
  ], [])
  .filter(key => key !== 'core');

const compileModule = process.env.MODULE || 'core';
exports.compilePath = compilePaths[compileModule];