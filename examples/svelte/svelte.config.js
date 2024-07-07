import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {Partial<import('@sveltejs/vite-plugin-svelte').Options>} */
export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  compilerOptions: {
    customElement: true
  },
  onwarn: (warning, handler) => {
    if (warning.code.startsWith('a11y-')) return;
    handler(warning);
  }
};
