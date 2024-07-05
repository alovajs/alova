import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';

const isCustomElement = tag => /^nord|trix/.test(tag);
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vueJsx({
      isCustomElement
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement
        }
      }
    })
  ],
  resolve: {
    extensions: ['.vue', '.tsx', '.js', '.ts']
  }
});
