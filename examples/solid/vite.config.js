import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [solid()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true
  }
});
