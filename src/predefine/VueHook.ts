import { ref, Ref, onUnmounted, watch, readonly } from 'vue';
import { FrontRequestState } from '../../typings';
import { forEach, objectKeys, trueValue } from '../utils/variables';

// Vue的预定义hooks
export default {
  create: <D>(data: D) => ref(data),
  export: <D>(state: Ref<D>) => readonly(state),    // 将导出的状态设置为readonly，不允许外部修改状态
  dehydrate: <D>(state: Ref<D>) => state.value,
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState<Ref<unknown>>) => forEach(
    objectKeys(newVal), 
    key => {
      type Keys = keyof FrontRequestState;
      state[key as Keys].value = newVal[key as Keys];
    }
  ),
  effectRequest(handler: () => void, removeStates: () => void, watchedStates?: any[], immediate = trueValue) {
    onUnmounted(removeStates);    // 组件卸载时移除对应状态
    if (!watchedStates) {
      handler();
      return;
    }
    watch(watchedStates, handler, { immediate });
  },
};