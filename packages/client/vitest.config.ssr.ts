import { svelte } from '@sveltejs/vite-plugin-svelte';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import solid from 'vite-plugin-solid';
import { defineProject, mergeConfig, Plugin } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

Reflect.deleteProperty(vitestConfigBase.test || {}, 'include');
export default mergeConfig(
  vitestConfigBase,
  defineProject({
    plugins: [
      vue(),
      solid({
        include: /\.solid\.spec\.(t|j)sx/
      }),
      react(),
      svelte()
    ] as Plugin[],
    test: {
      name: '[SSR]@alova/client',
      environment: 'node',
      include: ['test/ssr/**/*.{test,spec}.ts(x)?']
    }
  })
);
