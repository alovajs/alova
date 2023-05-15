import { Writable } from 'svelte/store';
import { EffectRequestParams } from '.';

type UnknownWritable = Writable<unknown>;
interface SvelteHook {
  create: <D>(data: D) => Writable<D>;
  export: <D>(state: Writable<D>) => Writable<D>;
  dehydrate: <D>(state: Writable<D>) => D;
  update: (newVal: Record<string, any>, states: Record<string, UnknownWritable>) => void;
  effectRequest(effectRequestParams: EffectRequestParams): void;
}
declare const svelteHook: SvelteHook;
export default svelteHook;
