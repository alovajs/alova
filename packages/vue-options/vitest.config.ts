import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

process.env.VUE_VERSION = 'v3';
export default defineConfig({
  plugins: [vue()],
  test: {
    ...vitestConfigBase,
    name: '@alova/vue-options | vue3'
  }
});
