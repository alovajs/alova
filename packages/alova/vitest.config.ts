import { defineConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

export default defineConfig({
  test: {
    ...vitestConfigBase,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'test/server'
    ]
  }
});
