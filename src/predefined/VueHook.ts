import { ref } from 'vue';

function create() {
  return {
    loading: ref<boolean>(false),
    data: ref<unknown | null>(null),
    error: ref<Error | null>(null),
    progress: ref<number>(0),
  };
}
type createRequestState = ReturnType<typeof create>;
type updateRequestState = {
  [x in keyof createRequestState]: createRequestState[x]['value'];
};

// Vue的预定义hooks
export default {
  create,
  update(newVal: updateRequestState, state: createRequestState) {
    state.loading.value = newVal.loading;
    state.data.value = newVal.data;
    state.error.value = newVal.error;
    state.progress.value = newVal.progress;
  }
};