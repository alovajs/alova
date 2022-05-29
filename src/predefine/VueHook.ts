import { ref, watch } from 'vue';

function create<R>(initialData?: R) {
  return {
    loading: ref<boolean>(false),
    data: ref<R | undefined>(initialData),
    error: ref<Error | undefined>(undefined),
    progress: ref<number>(0),
  };
}
type CreateRequestState = ReturnType<typeof create>;
type UpdateRequestState = {
  [x in keyof CreateRequestState]?: CreateRequestState[x]['value'];
};

// Vue的预定义hooks
export default {
  create,
  export: (state: CreateRequestState) => state,
  update(newVal: UpdateRequestState, state: CreateRequestState) {
    type Keys = keyof UpdateRequestState;
    Object.keys(newVal).forEach(key => {
      state[key as Keys].value = newVal[key as Keys];
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