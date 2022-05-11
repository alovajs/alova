import { ref, watch } from 'vue';

function create<R>() {
  return {
    loading: ref<boolean>(false),
    data: ref<R | null>(null),
    error: ref<Error | null>(null),
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
  watch(args: any[], handler: () => void) {
    watch(args, handler);
  },
};