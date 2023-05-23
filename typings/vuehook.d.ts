import { Ref, UnwrapRef, WatchSource } from 'vue';
import { EffectRequestParams } from '.';

type UnknownRef = Ref<unknown>;
interface VueHook {
  create: <D>(data: D) => Ref<UnwrapRef<D>>;
  export: <D>(state: Ref<D>) => Ref<D>;
  dehydrate: <D>(state: Ref<D>) => D;
  update: (newVal: Record<string, any>, states: Record<string, UnknownRef>) => void;
  effectRequest(effectRequestParams: EffectRequestParams<WatchSource<any> | object>): void;
}

declare const vueHook: VueHook;
export default vueHook;
