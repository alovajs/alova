import { useState } from 'react';


function create() {
  return {
    loading: useState<boolean>(false),
    data: useState<unknown | null>(null),
    error: useState<Error | null>(null),
    progress: useState<number>(0),
  };
}
type CreateRequestState = ReturnType<typeof create>;
type UpdateRequestState = {
  [x in keyof CreateRequestState]: CreateRequestState[x][0];
};

// React的预定义hooks
export default {
  create,
  update(newVal: UpdateRequestState, state: CreateRequestState) {
    state.loading[1](newVal.loading);
    state.data[1](newVal.data);
    state.error[1](newVal.error);
    state.progress[1](newVal.progress);
  },
};