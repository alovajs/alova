const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { default: replace } = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser');
const typescript = require('@rollup/plugin-typescript');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const basePath = process.cwd();
const pkgPath = resolve(basePath, './package.json');
const pkg = JSON.parse(readFileSync(pkgPath, { encoding: 'utf-8' }).toString());
const author = pkg.author;
const repository = pkg.repository.url.replace('git', 'https').replace('.git', '');

/**
 * format默认与format相同
 * suffix默认与format相同
 * ext默认为js
 */
const formatMap = {
  cjs: {
    suffix: 'common',
    ext: 'cjs'
  },
  esm: 'es',
  umd: 'umd',
  'umd.min': {
    format: 'umd'
  }
};

const defaultFormat = Object.keys(formatMap);
module.exports = function (bundleKey, version) {
  if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(bundleKey) && !version) {
    version = bundleKey;
    bundleKey = undefined;
  }
  version = version || pkg.version;
  const banner = `/**
  * ${pkg.name} ${version} (${pkg.homepage})
  * Document ${pkg.homepage}
  * Copyright ${new Date().getFullYear()} ${author}. All Rights Reserved
  * Licensed under MIT (${repository}/blob/main/LICENSE)
  */
`;
  const bundles = require(resolve(basePath, './build.json'));
  const bundleItem = bundleKey ? bundles[bundleKey] : bundles; // 如果没有bundleKey则表示只有一个bundle模块
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

  const moduleGroup = ['cjs', 'esm'];
  const groupTemp = [];
  // 将moduleGroup分到同一个数组里
  const groupedFormats = formats.reduce((group, fmt) => {
    if (moduleGroup.includes(fmt)) {
      groupTemp.push(fmt);
    } else {
      group.push([fmt]);
    }
    return group;
  }, []);
  groupTemp.length > 0 && groupedFormats.push(groupTemp);

  return groupedFormats.map(formatGroup => {
    const env = formatGroup.includes('umd.min')
      ? 'production'
      : formatGroup.includes('umd')
      ? 'development'
      : undefined;
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
          env &&
            replace({
              preventAssignment: true,
              'process.env.NODE_ENV': env ? JSON.stringify(env) : undefined
            }),
          json() // 可允许import json文件
        ]
      },
      outputOptionsList: formatGroup.map(fmt => {
        const { format = fmt, suffix = fmt, ext = 'js' } = formatMap[fmt];
        return {
          name: bundleItem.packageName,
          file: bundleItem.output.replace('{suffix}', suffix).replace('{ext}', ext),
          format,
          // When export and export default are not used at the same time, set legacy to true.
          // legacy: true,
          banner,
          globals,
          plugins: [env === 'production' ? terser() : undefined].filter(Boolean)
        };
      })
    };
  });
};
