import type { Config } from 'jest';
import Module from 'module';
import baseConfig from '../../jest.config.base';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
process.env.VUE_VERSION = 'v2';

// 保存原始的 require 函数
const originalRequire = Module.prototype.require;

// 重写 require 函数
(Module.prototype as any).require = function (...args: any) {
  // 拦截所有的 vue 引用，将其指向 vue2
  if (args[0] === 'vue') {
    return originalRequire.call(this, 'vue2');
  }
  if (args[0] === 'vue/compiler-sfc') {
    throw new Error('not install');
  }
  // 其他情况下，调用原始的 require 函数
  return originalRequire.apply(this, args);
};

const config: Config = {
  ...baseConfig,
  displayName: '@alova/vue-options | vue2',
  transform: {
    ...baseConfig.transform,
    '^.+\\.vue$': '@vue/vue2-jest'
  },
  setupFiles: ['./test/setup.ts'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,

    // must use absolute paths
    '^vue$': 'vue2/dist/vue.runtime.js',
    '^@testing-library\\/vue$': '@testing-library/vue2'
  },
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)']
};

export default config;
