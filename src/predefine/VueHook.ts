import { ref, Ref, onUnmounted, watch } from 'vue';
import { RequestState } from '../../typings';

// Vue的预定义hooks
export default {
  create: <D>(data: D) => ref(data),
  export: <D>(state: Ref<D>) => state,
  update: (newVal: Partial<RequestState>, state: RequestState<Ref<unknown>>) => Object.keys(newVal).forEach(key => {
    type Keys = keyof RequestState;
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