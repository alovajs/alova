import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/packages/alova',
    '<rootDir>/packages/adapter-axios',
    '<rootDir>/packages/adapter-mock',
    '<rootDir>/packages/adapter-xhr',
    '<rootDir>/packages/shared',
    '<rootDir>/packages/client'
  ]
};

export default config;
