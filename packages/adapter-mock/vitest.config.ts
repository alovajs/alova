import { resolve } from 'node:path';
import { defineProject, mergeConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

export default mergeConfig(
  vitestConfigBase,
  defineProject({
    test: {
      setupFiles: [resolve(__dirname, '../../internal/vitest.setup.mock.ts')]
    }
  })
);
