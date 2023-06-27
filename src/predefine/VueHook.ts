import {
  clearTimeoutTimer,
  forEach,
  isSSR,
  objectKeys,
  setTimeoutFn,
  trueValue,
  undefinedValue
} from '@/utils/variables';
import { onUnmounted, Ref, ref, watch, WatchSource } from 'vue';
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
    // 在服务端渲染时不发送请求
    if (isSSR) {
      return;
    }

    // 组件卸载时移除对应状态
    onUnmounted(removeStates);
    immediate && handler();

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
