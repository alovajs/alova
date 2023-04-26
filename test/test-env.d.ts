declare module '*.svelte' {
  export { SvelteComponentDev as default } from 'svelte/internal';
}

declare let isSSR: boolean;
