import { resolve } from 'node:path';
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    include: ['**/*.{test,test-d,spec,spec-d}.?(c|m)[jt]s?(x)'],
    alias: {
      '~': process.cwd(),
      '#': resolve(process.cwd(), 'test'),
      root: resolve(__dirname, 'internal'),
      '@': resolve(process.cwd(), 'src')
    },
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'internal/vitest.setup.ts')],
    globals: true
  }
});
