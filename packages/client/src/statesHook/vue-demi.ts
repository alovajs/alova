import { clearTimeoutTimer, forEach, objectKeys, setTimeoutFn, trueValue, undefinedValue } from '@alova/shared/vars';
import { StatesHook } from 'alova';
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

type UnknownRef = Ref<unknown>;
// Vue的预定义hooks
export default {
  create: data => ref(data),
  dehydrate: state => state.value,
  update: (newVal, states) =>
    forEach(objectKeys(newVal), key => {
      states[key].value = newVal[key];
    }),
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
} as StatesHook<UnknownRef, ComputedRef<unknown>, WatchSource<any> | object>;
