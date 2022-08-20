import { ref, Ref, onUnmounted, watch, readonly } from 'vue';
import { FrontRequestState, WatchingParams } from '../../typings';
import { forEach, objectKeys } from '../utils/variables';

type UnknownRef = Ref<unknown>;
// Vue的预定义hooks
export default {
  create: <D>(data: D) => ref(data),
  export: <D>(state: Ref<D>) => readonly(state),    // 将导出的状态设置为readonly，不允许外部修改状态
  dehydrate: <D>(state: Ref<D>) => state.value,
  update: (newVal: Partial<FrontRequestState>, states: FrontRequestState<UnknownRef, UnknownRef, UnknownRef, UnknownRef, UnknownRef>) => forEach(
    objectKeys(newVal), 
    key => {
      type Keys = keyof FrontRequestState;
      states[key as Keys].value = newVal[key as Keys];
    }
  ),
  effectRequest(handler: () => void, removeStates: () => void, { immediate, states }: WatchingParams) {
    onUnmounted(removeStates);    // 组件卸载时移除对应状态
    if (!states) {
      handler();
      return;
    }
    watch(states, handler, { immediate });
  },
};