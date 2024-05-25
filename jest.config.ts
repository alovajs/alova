import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/packages/alova',
    '<rootDir>/packages/adapter-axios',
    '<rootDir>/packages/adapter-mock',
    '<rootDir>/packages/adapter-xhr',
    '<rootDir>/packages/adapter-uniapp',
    '<rootDir>/packages/adapter-taro',
    '<rootDir>/packages/shared',
    '<rootDir>/packages/client',
    '<rootDir>/packages/vue-options'
  ]
};

export default config;
