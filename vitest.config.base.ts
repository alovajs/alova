import { resolve } from 'node:path';
import { defineProject } from 'vitest/config';

const internalDir = resolve(__dirname, 'internal');

export default defineProject({
  // Force a single Vue instance across the dependency tree. After migrating to
  // Vitest 4 / Vite 8 and adding @testing-library/vue + vue to vue-options, pnpm
  // resolved multiple `vue@3.5.39` copies (differing only by TS-suffix). A
  // component compiled by @vitejs/plugin-vue then used a different `vue` module
  // instance than the one `reactive()` is imported from, so state updates never
  // triggered re-renders. Dedupe collapses them to one copy.
  resolve: {
    dedupe: ['vue', 'vue-demi', '@vue/runtime-core', '@vue/runtime-dom', '@vue/shared', '@vue/reactivity']
  },
  plugins: [
    {
      // vitest v4 loads all project configs from the workspace root, so `process.cwd()`
      // no longer points to each package dir. Resolve `~ # @` aliases from the project
      // root exposed in the vite config hook instead.
      name: 'alova:project-alias',
      enforce: 'pre',
      config(cfg) {
        const root = cfg.root ? resolve(cfg.root) : process.cwd();
        return {
          resolve: {
            alias: {
              '~': root,
              '#': resolve(root, 'test'),
              root: internalDir,
              '@': resolve(root, 'src')
            }
          }
        };
      }
    }
  ],
  test: {
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'internal/vitest.setup.ts')],
    globals: true,
    // Vitest 4 defaults to the `forks` pool; set explicitly for clarity and
    // run test files in parallel for faster, more isolated runs.
    pool: 'forks',
    fileParallelism: true,
    // Retry flaky specs. A handful of suites assert on wall-clock timing
    // (e.g. debounce windows) or exercise Windows filesystem races (atomic
    // rename in the file-storage adapter). Under Vitest 4's rewritten pool the
    // parallel `forks` workers plus concurrent typechecking saturate CPU on
    // smaller machines, which occasionally delays timers or trips transient
    // EPERM/worker-exit errors. Retrying re-runs only the affected spec without
    // touching any test logic.
    retry: 2,
    bail: process.env.CI ? 1 : 0,
    typecheck: {
      include: ['**/*.{test-d,spec-d}.ts?(x)'],
      enabled: true,
      ignoreSourceErrors: true
    }
  }
});
