import { Module } from 'node:module';

const originalRequire = Module.prototype.require;
(Module.prototype as any).require = function (...args: any) {
  if (args[0] === 'vue') {
    return originalRequire.call(this, 'vue2');
  }
  return originalRequire.apply(this, args);
};
