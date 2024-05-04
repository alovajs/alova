import type { Config } from 'jest';
import baseConfig from 'alova-root/jest.config.base';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const config: Config = {
  ...baseConfig,
  displayName: 'alova/client',
  testMatch: ['**/test/**/*.spec.[tj]s?(x)'],
  transformIgnorePatterns: ['/node_modules/(?!(alova|@alova/mock))']
};

export default config;
