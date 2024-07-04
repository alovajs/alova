import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('nord')
        }
      }
    })
  ],
  resolve: {
    extensions: ['.vue', '.tsx', '.js', '.ts']
  }
});
