import { Module } from 'node:module';

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
