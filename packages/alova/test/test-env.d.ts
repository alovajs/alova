declare module '*.svelte' {
  export { SvelteComponentDev as default } from 'svelte/internal';
}

declare type ExpectTrue<T extends true> = T;
declare type ExpectFalse<T extends false> = T;
declare type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
