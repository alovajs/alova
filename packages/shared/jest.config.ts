import type { Config } from 'jest';
import baseConfig from '../../jest.config.base';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
const config: Config = {
  ...baseConfig,
  displayName: '@alova/shared',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)', '**/test/**/*.spec.solid.[tj]s?(x)'],
  transform: {
    '^.+\\.(j|t)sx$': 'ts-jest',
    '^.+\\.svelte$': 'svelte-jester',
    '^.+\\.vue$': '@vue/vue3-jest',
    '\\.solid\\.(j|t)sx$': 'solid-jest/transform'
  },
  // 还需要在tsconfig.json中设置allowJs为true
  transformIgnorePatterns: ['/node_modules/(?!(alova))']
};

export default config;
