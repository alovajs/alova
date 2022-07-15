import { ref, Ref, onUnmounted, watch, readonly } from 'vue';
import { FrontRequestState } from '../../typings';

// Vue的预定义hooks
export default {
  create: <D>(data: D) => ref(data),
  export: <D>(state: Ref<D>) => readonly(state),    // 不允许外部修改状态
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState<Ref<unknown>>) => Object.keys(newVal).forEach(key => {
    type Keys = keyof FrontRequestState;
    state[key as Keys].value = newVal[key as Keys];
  }),
  effectRequest(handler: () => void, removeStates: () => void, watchedStates?: any[], immediate = true) {
    onUnmounted(removeStates);    // 组件卸载时移除对应状态
    if (!watchedStates) {
      handler();
      return;
    }
    watch(watchedStates, handler, { immediate });
  },
};