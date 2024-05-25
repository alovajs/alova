import type { Config } from 'jest';
import baseConfig from '../../jest.config.base';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
process.env.VUE_VERSION = 'v3';
const config: Config = {
  ...baseConfig,
  displayName: '@alova/vue-options | vue3',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)']
};

export default config;
