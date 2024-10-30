import { StatesExportHelper, StatesHook } from 'alova';
import { ComputedRef, Ref, WatchSource } from 'vue-demi';

export type VueDemiHookExportType<T> = StatesExportHelper<{
  name: 'VueDemi';
  State: Ref<T>;
  Computed: ComputedRef<T>;
  Watched: WatchSource<T> | object;
  StateExport: Ref<T>;
  ComputedExport: ComputedRef<T>;
}>;

export type VueHookType = StatesHook<VueDemiHookExportType<unknown>>;
declare const vueHook: VueHookType;

export default vueHook;
