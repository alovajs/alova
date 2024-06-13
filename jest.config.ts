import type { Config } from 'jest';

const config: Config = {
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  clearMocks: true,

  maxWorkers: 2,
  maxConcurrency: 2,

  coveragePathIgnorePatterns: ['\\\\node_modules\\\\', '/node_modules/', 'internal/'],
  // Indicates which provider should be used to instrument code for coverage
  // coverageProvider: 'v8',

  // A list of reporter names that Jest uses when writing coverage reports
  // coverageReporters: ['json', 'text', 'lcov', 'clover'],

  // An object that configures minimum threshold enforcement for coverage results
  // coverageThreshold: undefined,

  projects: [
    '<rootDir>/packages/alova',
    '<rootDir>/packages/adapter-axios',
    '<rootDir>/packages/adapter-mock',
    '<rootDir>/packages/adapter-xhr',
    '<rootDir>/packages/adapter-uniapp',
    '<rootDir>/packages/adapter-taro',
    '<rootDir>/packages/shared',
    '<rootDir>/packages/client',
    '<rootDir>/packages/vue-options',
    '<rootDir>/packages/psc'
  ]
};

export default config;
