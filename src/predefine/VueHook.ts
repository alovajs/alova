import { ref, Ref, onUnmounted, watch } from 'vue';
import { FrontRequestState, EffectRequestParams } from '../../typings';
import { forEach, objectKeys } from '../utils/variables';

type UnknownRef = Ref<unknown>;
// Vue的预定义hooks
export default {
  create: <D>(data: D) => ref(data),
  export: <D>(state: Ref<D>) => state,
  dehydrate: <D>(state: Ref<D>) => state.value,
  update: (newVal: Partial<FrontRequestState>, states: FrontRequestState<UnknownRef, UnknownRef, UnknownRef, UnknownRef, UnknownRef>) => forEach(
    objectKeys(newVal), 
    key => {
      type Keys = keyof FrontRequestState;
      states[key as Keys].value = newVal[key as Keys];
    }
  ),
  effectRequest({
    handler,
    removeStates,
    immediate,
    watchingStates,
  }: EffectRequestParams) {
    onUnmounted(removeStates);    // 组件卸载时移除对应状态
    if (!watchingStates) {
      handler();
      return;
    }
    watch(watchingStates, handler, { immediate });
  },
};