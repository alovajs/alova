import vue from '@vitejs/plugin-vue';
import { defineProject, mergeConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

export default mergeConfig(
  vitestConfigBase,
  defineProject({
    plugins: [vue()],
    test: {
      env: {
        VUE_VERSION: 'v3'
      },
      name: '[vue3]vue-options'
    }
  })
);
