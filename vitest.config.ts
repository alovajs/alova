import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // vitest v4: workspace/defineWorkspace has been removed, use test.projects instead
    projects: ['packages/*/vitest.config.ts', 'packages/*/vitest.config.{node,server,vue2,ssr}.ts'],
    coverage: {
      include: ['packages/*/src/**/*'],
      reporter: ['text', 'lcov', 'html']
    }
  }
});
