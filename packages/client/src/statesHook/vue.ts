import { createSyncOnceRunner } from '@alova/shared/function';
import { forEach, setTimeoutFn, trueValue } from '@alova/shared/vars';
import { StatesHook } from 'alova';
import { computed, getCurrentInstance, onMounted, onUnmounted, ref, watch } from 'vue';
import { VueHookExportType } from '~/typings/stateshook/vue';

// Vue的预定义hooks
export default {
  name: 'Vue',
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

    const syncRunner = createSyncOnceRunner();
    forEach(watchingStates || [], (state, i) => {
      watch(
        state,
        () => {
          syncRunner(() => {
            handler(i);
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
    if (getCurrentInstance()) {
      onMounted(callback);
    } else {
      setTimeoutFn(callback, 10);
    }
  },
  onUnmounted: callback => {
    getCurrentInstance() && onUnmounted(callback);
  }
} as StatesHook<VueHookExportType<unknown>>;
