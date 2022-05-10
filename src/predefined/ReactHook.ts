import { useState } from 'react';


function create<D>() {
  return {
    loading: useState<boolean>(false),
    data: useState<D | null>(null),
    error: useState<Error | null>(null),
    progress: useState<number>(0),
  };
}
type CreateRequestState = ReturnType<typeof create>;
type UpdateRequestState = {
  [x in keyof CreateRequestState]?: CreateRequestState[x][0];
};

// React的预定义hooks
export default {
  create,
  export(state: CreateRequestState) {
    return {
      loading: state.loading[0],
      data: state.data[0],
      error: state.error[0],
      progress: state.progress[0],
    };
  },
  update(newVal: UpdateRequestState, state: CreateRequestState) {
    type Keys = keyof UpdateRequestState;
    Object.keys(newVal).forEach(key => {
      state[key as Keys][1](newVal[key as Keys] as any);
    });
  },
};