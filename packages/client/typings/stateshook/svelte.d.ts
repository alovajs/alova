import { Readable, Writable } from 'svelte/store';
import { StatesHook } from '..';

export type SvelteHookType = StatesHook<Writable<unknown>, Readable<unknown>>;
declare const svelteHook: SvelteHookType;

export default svelteHook;
