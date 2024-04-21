import type { Config } from 'jest';
import baseConfig from '../../jest.config.base';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const config: Config = {
  ...baseConfig,
  displayName: 'alova',
  testEnvironment: 'node'
};

export default config;
