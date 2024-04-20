const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const terser = require('@rollup/plugin-terser');
const typescript = require('@rollup/plugin-typescript');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const basePath = process.cwd();
const pkgPath = resolve(basePath, './package.json');
const pkg = JSON.parse(readFileSync(pkgPath, { encoding: 'utf-8' }).toString());
const author = pkg.author;
const repository = pkg.repository.url.replace('git', 'https').replace('.git', '');
const formatMap = {
  cjs: 'cjs',
  esm: 'es',
  umd: 'umd',
  'umd.min': 'umd'
};
const defaultFormat = Object.keys(formatMap);
module.exports = function (bundleKey, version) {
  version = version || pkg.version;
  const banner = `/**
  * ${pkg.name} ${version} (${pkg.homepage})
  * Document ${pkg.homepage}
  * Copyright ${new Date().getFullYear()} ${author}. All Rights Reserved
  * Licensed under MIT (${repository}/blob/main/LICENSE)
  */
`;
  const bundles = require(resolve(basePath, './bundle.config.cjs'));
  const bundleItem = bundles[bundleKey];
  if (!bundleItem) {
    throw new Error(`Can not find compile config for module: ${bundleKey}`);
  }

  const formats = bundleItem.formats || defaultFormat;
  // 计算external、globals
  const external = bundleItem.external ? Object.keys(bundleItem.external) : undefined;
  const globals = (external || []).reduce((g, key) => {
    const globalVal = bundleItem.external[key];
    if (![undefined, null].includes(globalVal)) {
      g[key] = globalVal;
    }
    return g;
  }, {});

  return {
    inputOptions: {
      input: bundleItem.input,
      external,
      plugins: [
        nodeResolve({
          browser: true,
          extensions: ['.ts', '.js', 'tsx', 'jsx']
        }),
        commonjs(),
        typescript({ module: 'es2015' }),
        json() // 可允许import json文件
      ]
    },
    outputOptionsList: formats.map(fmt => {
      const isProd = fmt.endsWith('.min');
      return {
        isProd,
        name: bundleItem.packageName,
        file: bundleItem.output.replace('{format}', fmt),
        format: formatMap[fmt],
        // When export and export default are not used at the same time, set legacy to true.
        // legacy: true,
        banner,
        globals,
        plugins: [isProd ? terser() : undefined]
      };
    })
  };
};
