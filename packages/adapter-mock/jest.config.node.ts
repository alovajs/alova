import type { Config } from 'jest';
import { resolve } from 'node:path';
import baseConfig from '../../jest.config.base';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const config: Config = {
  ...baseConfig,
  displayName: '@alova/mock',
  setupFilesAfterEnv: [resolve(__dirname, '../../internal/jest.setup.mock.ts')],
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)']
};

export default config;
