import type { Config } from 'jest';
import baseConfig from '../../jest.config.base';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const config: Config = {
  ...baseConfig,
  displayName: 'alova/client',
  testMatch: ['**/test/**/*.spec.[tj]s?(x)', '**/test/**/*.spec.solid.[tj]s?(x)'],
  modulePathIgnorePatterns: ['<rootDir>/test/ssr'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // fix: commonjs import will be undefined in svelte
    'alova/fetch': '<rootDir>/node_modules/alova/dist/adapter/fetch.esm.js'
  },
  transformIgnorePatterns: ['/node_modules/(?!(alova|@alova/mock))']
};

export default config;
