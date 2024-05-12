import { Readable, Writable } from 'svelte/store';
import { StatesHook } from '..';

declare const svelteHook: StatesHook<Writable<unknown>, Readable<unknown>>;
export default svelteHook;
