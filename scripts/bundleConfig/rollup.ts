import typescript from '@rollup/plugin-typescript';
import { resolve } from 'path';

const pkg = require(resolve(process.cwd(), 'package.json'));
const version = process.env.VERSION || pkg.version;
const author = pkg.author;
const repository = pkg.repository.url.replace('git', 'https').replace('.git', '');

export const banner = `/**
  * ${pkg.name} ${version} (${pkg.homepage})
  * Document ${pkg.homepage}
  * Copyright ${new Date().getFullYear()} ${author}. All Rights Reserved
  * Licensed under MIT (${repository}/blob/main/LICENSE)
  */
`;

export const getCompiler = () => typescript({ module: 'ES2015' });

interface CompilePath {
  packageName: string;
  input: string;
  externalMap?: Record<string, string | undefined>;
  output: (suffix: string, ext?: string) => string;
}
const compilePaths: Record<string, CompilePath> = {
  core: {
    packageName: pkg.name,
    input: 'src/index.ts',
    output: (suffix: string, ext = 'js') => `dist/${pkg.name}.${suffix}.${ext}`
  },
  vue: {
    packageName: 'VueHook',
    input: 'src/predefine/VueHook.ts',

    // key作为external数组，external对象作为global对象
    externalMap: {
      vue: 'Vue'
    },
    output: (suffix: string, ext = 'js') => `dist/hooks/vuehook.${suffix}.${ext}`
  },
  react: {
    packageName: 'ReactHook',
    input: 'src/predefine/ReactHook.ts',
    externalMap: {
      react: 'React'
    },
    output: (suffix: string, ext = 'js') => `dist/hooks/reacthook.${suffix}.${ext}`
  },
  svelte: {
    externalMap: {
      // undefined或null表示需要从globals中过滤掉
      svelte: undefined,
      'svelte/store': undefined
    },
    packageName: 'SvelteHook',
    input: 'src/predefine/SvelteHook.ts',
    output: (suffix: string, ext = 'js') => `dist/hooks/sveltehook.${suffix}.${ext}`
  },
  globalFetch: {
    packageName: 'GlobalFetch',
    input: 'src/predefine/GlobalFetch.ts',
    output: (suffix: string, ext = 'js') => `dist/adapter/globalfetch.${suffix}.${ext}`
  }
};

const compileModule = process.env.MODULE || 'core';
export const compilePath = compilePaths[compileModule];

// 计算external、globals
export const external = compilePath.externalMap ? Object.keys(compilePath.externalMap) : [];
export const gloabls = external.reduce((globals, key) => {
  const externalMap = compilePath.externalMap || {};
  const globalVal = externalMap[key] || undefined;
  if (![undefined, null].includes(globalVal as any)) {
    globals[key] = globalVal;
  }
  return globals;
}, {} as Record<string, any>);
