import { Ref, WatchSource } from 'vue';
import { EffectRequestParams } from '.';

interface VueHook {
  create: <D>(data: D) => Ref<D>;
  export: <D>(state: Ref<D>) => Ref<D>;
  dehydrate: <D>(state: Ref<D>) => D;
  update: (newVal: Record<string, any>, states: Record<string, Ref<unknown>>) => void;
  effectRequest(effectRequestParams: EffectRequestParams<WatchSource<any> | object>): void;
}

declare const vueHook: VueHook;
export default vueHook;
