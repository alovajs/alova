import { Ref, UnwrapRef } from 'vue';
import { RequestState } from '.';

interface VueHook {
  create: <D>(data: D) => Ref<UnwrapRef<D>>;
  export: <D>(state: Ref<D>) => Ref<D>;
  update: (newVal: Partial<RequestState>, state: RequestState<Ref<unknown>>) => void;
  effectRequest(handler: () => void, removeStates: () => void, watchedStates?: any[], immediate?: boolean): void;
}
declare const vueHook: VueHook;
export default vueHook;