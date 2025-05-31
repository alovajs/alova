import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    extensions: ['.svelte', '.js', '.ts']
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true
  }
});
