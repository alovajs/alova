import type { Config } from 'jest';
import baseConfig from '../../jest.config.base';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
const config: Config = {
  ...baseConfig,
  displayName: '@alova/shared',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  // 还需要在tsconfig.json中设置allowJs为true
  transformIgnorePatterns: ['/node_modules/(?!(alova))']
};

export default config;
