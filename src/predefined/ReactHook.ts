import { useEffect, useRef, useState } from 'react';

function create<R>(initialData?: R) {
  return {
    loading: useState<boolean>(false),
    data: useState<R | undefined>(initialData),
    error: useState<Error | undefined>(undefined),
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
  effectRequest(handler: () => void, watchedStates: any[], immediate: boolean) {
    const mountedRef = useRef(false);
    useEffect(() => {
      if (!immediate && !mountedRef.current) {
        mountedRef.current = true;
        return;
      }
      handler();
    }, watchedStates);
  },
};