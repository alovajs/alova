import { clearTimeoutTimer, forEach, setTimeoutFn, trueValue, undefinedValue } from '@alova/shared';
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
  effectRequest({ handler, removeStates, immediate, watchingStates }) {
    // When used inside a component, the corresponding state is removed when the component is unloaded.
    if (getCurrentInstance()) {
      onUnmounted(removeStates);
      onMounted(() => immediate && handler());
    } else {
      // When used inside a non-component, use a timer to delay execution.
      setTimeoutFn(() => {
        immediate && handler();
      });
    }

    let timer: any;
    forEach(watchingStates || [], (state, i) => {
      watch(
        state,
        () => {
          timer && clearTimeoutTimer(timer);
          timer = setTimeoutFn(() => {
            handler(i);
            timer = undefinedValue;
          });
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
    onMounted(callback);
  },
  onUnmounted: callback => {
    onUnmounted(callback);
  }
} as StatesHook<VueDemiHookExportType<unknown>>;
