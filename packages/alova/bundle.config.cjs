const pkg = require('./package.json');

module.exports = {
  core: {
    packageName: pkg.name,
    input: 'src/index.ts',
    output: `./dist/${pkg.name}.{format}.js`
  },
  vuehook: {
    packageName: 'VueHook',
    input: 'src/predefine/VueHook.ts',
    // key作为external数组，external对象作为global对象
    external: {
      vue: 'Vue'
    },
    output: './dist/hooks/vuehook.{format}.js',
    formats: ['esm', 'umd', 'umd.min']
  },
  reacthook: {
    packageName: 'ReactHook',
    input: 'src/predefine/ReactHook.ts',
    external: {
      react: 'React'
    },
    output: './dist/hooks/reacthook.{format}.js',
    formats: ['esm', 'umd', 'umd.min']
  },
  sveltehook: {
    external: {
      // undefined或null表示需要从globals中过滤掉
      svelte: undefined,
      'svelte/store': undefined
    },
    packageName: 'SvelteHook',
    input: 'src/predefine/SvelteHook.ts',
    output: './dist/hooks/sveltehook.{format}.js',
    formats: ['esm', 'cjs']
  },
  globalfetch: {
    packageName: 'GlobalFetch',
    input: 'src/predefine/GlobalFetch.ts',
    output: './dist/adapter/globalfetch.{format}.js'
  }
};
