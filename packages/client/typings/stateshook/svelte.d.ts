import { StatesExportHelper, StatesHook } from 'alova';
import { Readable, Writable } from 'svelte/store';

export type SvelteHookExportType<T> = StatesExportHelper<{
  name: 'Svelte';
  State: Writable<T>;
  Computed: Readable<T>;
  Watched: Writable<T>;
  StateExport: Writable<T>;
  ComputedExport: Readable<T>;
}>;

export type SvelteHookType = StatesHook<SvelteHookExportType<unknown>>;
declare const svelteHook: SvelteHookType;

export default svelteHook;
