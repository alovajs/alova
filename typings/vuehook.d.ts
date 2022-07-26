import { Ref, UnwrapRef } from 'vue';
import { FrontRequestState, WatchingParams } from '.';

type UnknownRef = Ref<unknown>;
interface VueHook {
  create: <D>(data: D) => Ref<UnwrapRef<D>>;
  export: <D>(state: Ref<D>) => Ref<D>;
  dehydrate: <D>(state: Ref<D>) => D;
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState<UnknownRef, UnknownRef, UnknownRef, UnknownRef, UnknownRef>) => void;
  effectRequest(handler: () => void, removeStates: () => void, watchedStates: WatchingParams): void;
}
declare const vueHook: VueHook;
export default vueHook;