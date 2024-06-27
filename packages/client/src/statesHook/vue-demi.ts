import { clearTimeoutTimer, forEach, setTimeoutFn, trueValue, undefinedValue } from '@alova/shared/vars';
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
  Export: Ref<T> | ComputedRef<T>;
  Watched: WatchSource<T> | object;
  StateExport: Ref<T>;
  ComputedExport: ComputedRef<T>;
}>;

// Vue的预定义hooks
export default {
  name: 'VueDemi',
  create: data => ref(data),
  dehydrate: state => state.value,
  update: (newVal, state) => {
    state.value = newVal;
  },
  effectRequest({ handler, removeStates, immediate, watchingStates }) {
    // 当在组件内部使用时，组件卸载时移除对应状态
    if (getCurrentInstance()) {
      onUnmounted(removeStates);
      onMounted(() => immediate && handler());
    } else {
      // 在非组件内部使用时，使用定时器延迟执行
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
