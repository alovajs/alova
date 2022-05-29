import { Ref, ref, watch } from 'vue';

// Vue的预定义hooks
export default {
  create: <D>(state: D) => ref<D>(state),
  export: <D>(state: Ref<D>) => state,
  update<D>(newVal: Record<string, D>, state: Record<string, Ref<D>>) {
    Object.keys(newVal).forEach(key => {
      state[key].value = newVal[key];
    });
  },
  effectRequest(handler: () => void, watchedStates: any[], immediate: boolean) {
    if (watchedStates.length <= 0) {
      handler();
      return;
    }
    watch(watchedStates, handler, { immediate });
  },
};