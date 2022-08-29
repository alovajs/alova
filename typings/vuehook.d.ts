import { DeepReadonly, Ref, UnwrapRef } from 'vue';
import { EffectRequestParams, FrontRequestState } from '.';
export { Ref } from 'vue';

type UnknownRef = Ref<unknown>;
interface VueHook {
  create: <D>(data: D) => Ref<UnwrapRef<D>>;
  export: <D>(state: Ref<D>) => Ref<D>;
  dehydrate: <D>(state: Ref<D>) => D;
  update: (newVal: Partial<FrontRequestState>, states: FrontRequestState<UnknownRef, UnknownRef, UnknownRef, UnknownRef, UnknownRef>) => void;
  effectRequest(effectRequestParams: EffectRequestParams): void;
}

declare const vueHook: VueHook;
export default vueHook;