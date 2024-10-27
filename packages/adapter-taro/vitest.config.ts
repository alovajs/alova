import { defineConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

export default defineConfig({
  test: {
    ...vitestConfigBase,
    setupFiles: [...(vitestConfigBase?.setupFiles || []), './test/setup.ts'],
    server: {
      deps: {
        inline: ['@tarojs/runtime']
      }
    }
  }
});
