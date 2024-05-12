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
const { author } = pkg;
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
module.exports = function rollupConfig(bundleConfig, version) {
  version = version || pkg.version;
  const banner = `/**
  * ${pkg.name} ${version} (${pkg.homepage})
  * Document ${pkg.homepage}
  * Copyright ${new Date().getFullYear()} ${author}. All Rights Reserved
  * Licensed under MIT (${repository}/blob/main/LICENSE)
  */
`;

  if (!bundleConfig) {
    throw new Error(`bundle config is undefined`);
  }

  const formats = bundleConfig.formats || defaultFormat;
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
    // 计算环境变量
    const env = formatGroup.includes('umd.min') ? 'production' : formatGroup.includes('umd') ? 'development' : undefined;
    // 计算external、globals，当external的属性值设为null或undefined时，在umd中不会作为外部依赖。
    const external = [];
    const globals = bundleConfig.external;
    for (const key in bundleConfig.external || {}) {
      const globalVal = bundleConfig.external[key];
      globals[key] = globalVal;
      if (![undefined, null].includes(globalVal) || !env) {
        external.push(key);
      }
    }

    return {
      inputOptions: {
        input: bundleConfig.input,
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
          name: bundleConfig.packageName,
          file: bundleConfig.output.replace('{suffix}', suffix).replace('{ext}', ext),
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
