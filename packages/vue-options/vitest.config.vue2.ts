import vue2 from '@vitejs/plugin-vue2';
import compiler from '@vue2/compiler-sfc';
import path from 'node:path';
import { defineProject, mergeConfig, Plugin } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

process.env.VUE_VERSION = 'v2';
export default mergeConfig(
  vitestConfigBase,
  defineProject({
    plugins: [
      vue2({
        compiler: compiler as any
      }) as Plugin
    ],
    test: {
      name: '@alova/vue-options|vue2',
      setupFiles: ['./test/setup.ts'],
      alias: {
        vue: path.resolve('./node_modules/vue2'),
        '@testing-library/vue': path.resolve('./node_modules/@testing-library/vue2')
      }
    }
  })
);
