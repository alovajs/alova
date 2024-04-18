import { clearTimeoutTimer, forEach, objectKeys, setTimeoutFn, trueValue, undefinedValue } from '@/utils/variables';
import { getCurrentInstance, onMounted, onUnmounted, Ref, ref, watch, WatchSource } from 'vue';
import { EffectRequestParams } from '~/typings';

type UnknownRef = Ref<unknown>;
// Vue的预定义hooks
export default {
  create: <D>(data: D) => ref(data),
  export: <D>(state: Ref<D>) => state,
  dehydrate: <D>(state: Ref<D>) => state.value,
  update: (newVal: Record<string, any>, states: Record<string, UnknownRef>) =>
    forEach(objectKeys(newVal), key => {
      states[key].value = newVal[key];
    }),
  effectRequest({ handler, removeStates, immediate, watchingStates }: EffectRequestParams<WatchSource>) {
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
  }
};
