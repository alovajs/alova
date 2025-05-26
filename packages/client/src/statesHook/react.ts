import { falseValue, isNumber, noop, undefinedValue } from '@alova/shared';
import { StatesHook } from 'alova';
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactHookExportType, ReactState } from '~/typings/stateshook/react';

const stateToData = <D>(reactState: ReactState<D>) => (2 in reactState ? reactState[2] : reactState[0]);
const refCurrent = <T>(ref: MutableRefObject<T>) => ref.current;
const setRef = <T>(ref: MutableRefObject<T>, newVal: T) => {
  ref.current = newVal;
};

// the react predefined hooks
export default {
  name: 'React',
  create: initialValue => useState(initialValue),
  export: stateToData,
  dehydrate: stateToData,
  update: (newVal, state) => {
    // update value synchronously so that we can access the new value synchronously.
    state[2] = newVal;
    state[1](newVal);
  },
  memorize: fn => {
    // use `useCallback` to ensure the same reference, and refer the newest function with `useRef`
    const fnRef = useRef(noop as typeof fn);
    setRef(fnRef, fn);
    return useCallback((...args: any[]) => refCurrent(fnRef)(...args), []);
  },
  ref: initialValue => {
    const refObj = useRef(initialValue);
    refCurrent(refObj) === undefinedValue && setRef(refObj, initialValue);
    return refObj;
  },
  effectRequest({ handler, removeStates, immediate, watchingStates = [] }) {
    // `handler` is called when some states change are detected
    const oldStates = useRef(watchingStates);

    useEffect(() => {
      const oldStatesValue = refCurrent(oldStates);
      // compare the old and new value, and get the index of changed state
      let changedIndex: number | undefined = undefinedValue;
      for (const index in watchingStates) {
        if (!Object.is(oldStatesValue[index], watchingStates[index])) {
          changedIndex = Number(index);
          break;
        }
      }
      setRef(oldStates, watchingStates);
      if (immediate || isNumber(changedIndex)) {
        handler(changedIndex);
      }
    }, watchingStates);

    // remove states when component is unmounted
    useEffect(() => removeStates, []);
  },
  computed: (getter, depList) => {
    const memo = useMemo(getter, depList);
    return [memo, noop];
  },
  watch: (states, callback) => {
    // When there is a monitoring state, the state changes and then triggers
    const needEmit = useRef(falseValue);
    useEffect(() => {
      needEmit.current ? callback() : (needEmit.current = true);
    }, states);
  },
  onMounted: callback => {
    useEffect(callback, []);
  },
  onUnmounted: callback => {
    useEffect(() => callback, []);
  }
} as StatesHook<ReactHookExportType<unknown>>;
