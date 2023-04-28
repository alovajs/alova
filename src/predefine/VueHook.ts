import { clearTimeoutTimer, forEach, objectKeys, setTimeoutFn, trueValue, undefinedValue } from '@/utils/variables';
import { onUnmounted, ref, Ref, watch, WatchSource } from 'vue';
import { EffectRequestParams, FrontRequestState } from '~/typings';

type UnknownRef = Ref<unknown>;
// Vue的预定义hooks
export default {
  create: <D>(data: D) => ref(data),
  export: <D>(state: Ref<D>) => state,
  dehydrate: <D>(state: Ref<D>) => state.value,
  update: (
    newVal: Partial<FrontRequestState>,
    states: FrontRequestState<UnknownRef, UnknownRef, UnknownRef, UnknownRef, UnknownRef>
  ) =>
    forEach(objectKeys(newVal), key => {
      type Keys = keyof FrontRequestState;
      states[key as Keys].value = newVal[key as Keys];
    }),
  effectRequest({ handler, removeStates, immediate, watchingStates }: EffectRequestParams<WatchSource>) {
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
