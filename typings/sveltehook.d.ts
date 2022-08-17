import { FrontRequestState, WatchingParams } from '.';
import { Readable } from 'svelte/store';
export { Readable } from 'svelte/store';

interface SvelteState<D> extends Readable<D> {
  val: D;
  set(this: void, val: D): void;
}
type UnknownState = SvelteState<unknown>;
interface SvelteHook {
  create: <D>(data: D) => SvelteState<D>;
  export: <D>(state: SvelteState<D>) => Readable<D>;
  dehydrate: <D>(state: SvelteState<D>) => D;
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState<UnknownState, UnknownState, UnknownState, UnknownState, UnknownState>) => void;
  effectRequest(handler: () => void, removeStates: () => void, watchedStates: WatchingParams): void;
}
declare const svelteHook: SvelteHook;
export default svelteHook;