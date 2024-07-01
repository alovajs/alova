import { StatesExportHelper, StatesHook } from 'alova';
import { ComputedRef, Ref, WatchSource } from 'vue';

export type VueHookExportType<T> = StatesExportHelper<{
  name: 'Vue';
  State: Ref<T>;
  Computed: ComputedRef<T>;
  Watched: WatchSource<T> | object;
  StateExport: Ref<T>;
  ComputedExport: ComputedRef<T>;
}>;

export type VueHookType = StatesHook<VueHookExportType<unknown>>;
declare const vueHook: VueHookType;

export default vueHook;
