import { useState, Dispatch, SetStateAction } from 'react';
import { StatesHook } from '../../typings';

type ReactState<T> = [T, Dispatch<SetStateAction<T>>];
type ReactStatesHook = StatesHook<
  ReactState<boolean>,
  ReactState<unknown>,
  ReactState<Error | null>,
  ReactState<number>
>;
// React的预定义hooks
export default {
  create() {
    return {
      loading: useState(false),
      data: useState(null),
      error: useState(null),
      progress: useState(0),
    };
  },
  update(newVal, state) {
    state.loading[1](newVal.loading);
    state.data[1](newVal.data);
    state.error[1](newVal.error);
    state.progress[1](newVal.progress);
  },
} as ReactStatesHook;