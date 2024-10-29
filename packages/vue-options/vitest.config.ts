import vue from '@vitejs/plugin-vue';
import { defineProject, mergeConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

process.env.VUE_VERSION = 'v3';
export default mergeConfig(
  vitestConfigBase,
  defineProject({
    plugins: [vue()],
    test: {
      name: '@alova/vue-options|vue3'
    }
  })
);
