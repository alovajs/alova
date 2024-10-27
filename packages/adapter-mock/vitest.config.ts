import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

export default defineConfig({
  test: {
    ...vitestConfigBase,
    setupFiles: [resolve(__dirname, '../../internal/jest.setup.mock.ts')]
  }
});
