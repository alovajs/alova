import { ref } from 'vue';

function create() {
  return {
    loading: ref<boolean>(false),
    data: ref<unknown | null>(null),
    error: ref<Error | null>(null),
    progress: ref<number>(0),
  };
}
type CreateRequestState = ReturnType<typeof create>;
type UpdateRequestState = {
  [x in keyof CreateRequestState]: CreateRequestState[x]['value'];
};

// Vue的预定义hooks
export default {
  create,
  update(newVal: UpdateRequestState, state: CreateRequestState) {
    state.loading.value = newVal.loading;
    state.data.value = newVal.data;
    state.error.value = newVal.error;
    state.progress.value = newVal.progress;
  }
};