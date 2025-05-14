import { resolve } from 'node:path';
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    alias: {
      '~': process.cwd(),
      '#': resolve(process.cwd(), 'test'),
      root: resolve(__dirname, 'internal'),
      '@': resolve(process.cwd(), 'src')
    },
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'internal/vitest.setup.ts')],
    globals: true,
    typecheck: {
      include: ['**/*.{test-d,spec-d}.ts?(x)'],
      enabled: true,
      ignoreSourceErrors: true
    }
  }
});
