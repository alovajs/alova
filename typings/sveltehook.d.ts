import { Writable } from 'svelte/store';
import { EffectRequestParams, FrontRequestState } from '.';

export interface SvelteState<D> extends Writable<D> {
  val: D;
  set(this: void, val: D): void;
}
type UnknownState = SvelteState<unknown>;
interface SvelteHook {
  create: <D>(data: D) => SvelteState<D>;
  export: <D>(state: SvelteState<D>) => SvelteState<D>;
  dehydrate: <D>(state: SvelteState<D>) => D;
  update: (newVal: Partial<FrontRequestState>, states: FrontRequestState<UnknownState, UnknownState, UnknownState, UnknownState, UnknownState>) => void;
  effectRequest(effectRequestParams: EffectRequestParams): void;
}
declare const svelteHook: SvelteHook;
export default svelteHook;