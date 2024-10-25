import { svelte } from '@sveltejs/vite-plugin-svelte';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

export default defineConfig({
  plugins: [
    vue(),
    react(),
    svelte(),
    solid({
      extensions: ['.solid.spec.tsx']
    })
  ],
  resolve: {
    conditions: ['development', 'browser']
  },
  test: {
    ...vitestConfigBase,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'test/ssr'
    ],
    server: {
      deps: {
        inline: [/solid-js/]
      }
    }
  }
});
