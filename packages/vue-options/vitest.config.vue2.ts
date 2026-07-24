import vue2 from '@vitejs/plugin-vue2';
import compiler from '@vue2/compiler-sfc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig, Plugin } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  vitestConfigBase,
  defineProject({
    plugins: [
      vue2({
        compiler: compiler as any
      }) as Plugin
    ],
    test: {
      name: '[vue2]vue-options',
      env: {
        VUE_VERSION: 'v2'
      },
      setupFiles: ['./test/setup.ts'],
      alias: {
        vue: path.resolve(dirname, './node_modules/vue2'),
        '@testing-library/vue': path.resolve(dirname, './node_modules/@testing-library/vue2')
      }
    }
  })
);
