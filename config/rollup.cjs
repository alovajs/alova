// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const typescript = require('rollup-plugin-typescript2');
const pkg = require('../package.json');
const version = process.env.VERSION || pkg.version;
const author = pkg.author;
const repository = pkg.repository.url.replace('git', 'https').replace('.git', '');

const banner = `/**
  * ${pkg.name} ${version} (${pkg.homepage})
  * Document ${pkg.homepage}
  * Copyright ${new Date().getFullYear()} ${author}. All Rights Reserved
  * Licensed under MIT (${repository}/blob/main/LICENSE)
  */
`;

const getCompiler = (
  opt = {
    // objectHashIgnoreUnknownHack: true,
    // clean: true,
    tsconfigOverride: {
      compilerOptions: {
        module: 'ES2015'
      }
    }
  }
) => typescript(opt);
exports.banner = banner;
exports.getCompiler = getCompiler;
const compilePaths = {
  core: {
    packageName: pkg.name,
    input: 'src/index.ts',
    output: suffix => `dist/${pkg.name}.${suffix}.js`
  },
  vue: {
    packageName: 'VueHook',
    input: 'src/predefine/VueHook.ts',

    // key作为external数组，external对象作为global对象
    externalMap: {
      vue: 'Vue'
    },
    output: suffix => `dist/hooks/vuehook.${suffix}.js`
  },
  react: {
    packageName: 'ReactHook',
    input: 'src/predefine/ReactHook.ts',
    externalMap: {
      react: 'React'
    },
    output: suffix => `dist/hooks/reacthook.${suffix}.js`
  },
  svelte: {
    externalMap: {
      // undefined或null表示需要从globals中过滤掉
      svelte: undefined,
      'svelte/store': undefined
    },
    packageName: 'SvelteHook',
    input: 'src/predefine/SvelteHook.ts',
    output: suffix => `dist/hooks/sveltehook.${suffix}.js`
  },
  globalFetch: {
    packageName: 'GlobalFetch',
    input: 'src/predefine/GlobalFetch.ts',
    output: suffix => `dist/adapter/globalfetch.${suffix}.js`
  }
};

const compileModule = process.env.MODULE || 'core';
const compilePath = (exports.compilePath = compilePaths[compileModule]);
// 计算external、globals
if (compilePath.externalMap) {
  const external = (exports.external = Object.keys(compilePath.externalMap));
  exports.globals = external.reduce((globals, key) => {
    const globalVal = compilePath.externalMap[key];
    if (![undefined, null].includes(globalVal)) {
      globals[key] = globalVal;
    }
    return globals;
  }, {});
}
