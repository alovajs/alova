import { forEach, trueValue } from '@alova/shared';
import { StatesExportHelper, StatesHook } from 'alova';
import {
  ComputedRef,
  Ref,
  WatchSource,
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue-demi';

export type VueDemiHookExportType<T> = StatesExportHelper<{
  name: 'VueDemi';
  State: Ref<T>;
  Computed: ComputedRef<T>;
  Watched: WatchSource<T> | object;
  StateExport: Ref<T>;
  ComputedExport: ComputedRef<T>;
}>;

// Vue’s predefined hooks
export default {
  name: 'VueDemi',
  create: data => ref(data),
  dehydrate: state => state.value,
  update: (newVal, state) => {
    state.value = newVal;
  },
  effectRequest({ handler, immediate, watchingStates }) {
    immediate && handler();

    forEach(watchingStates || [], (state, i) => {
      watch(
        state,
        () => {
          handler(i);
        },
        { deep: trueValue }
      );
    });
  },
  computed: getter => computed(getter),
  watch: (states, callback) => {
    watch(states, callback, {
      deep: trueValue
    });
  },
  onMounted: callback => {
    getCurrentInstance() && onMounted(callback);
  },
  onUnmounted: callback => {
    onUnmounted(callback);
  }
} as StatesHook<VueDemiHookExportType<unknown>>;
