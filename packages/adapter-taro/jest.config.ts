import type { Config } from 'jest';
import baseConfig from '../../jest.config.base';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
const config: Config = {
  ...baseConfig,
  displayName: '@alova/adapter-taro',
  setupFilesAfterEnv: [...(baseConfig.setupFilesAfterEnv || []), './test/setup.ts'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)']
};

export default config;
