import { resolve } from 'node:path';
import { defineProject, mergeConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

export default mergeConfig(
  vitestConfigBase,
  defineProject({
    test: {
      setupFiles: [resolve(__dirname, 'test/setup.ts')],
      typecheck: { enabled: false },
      retry: 2,
      pool: 'threads'
    }
  })
);
