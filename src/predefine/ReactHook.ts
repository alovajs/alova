import { forEach, objectKeys, trueValue, undefinedValue } from '@/utils/variables';
import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { EffectRequestParams, FrontRequestState } from '~/typings';

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
const stateToData = <D>([state]: ReactState<D>) => state;
type UnknownState = ReactState<unknown>;

const refCurrent = <T>(ref: MutableRefObject<T>) => ref.current;
const setRef = <T>(ref: MutableRefObject<T>, newVal: T) => (ref.current = newVal);

// React的预定义hooks
export default {
  create: (data: any) => useState(data),
  export: stateToData,
  dehydrate: stateToData,
  update: (
    newVal: Partial<FrontRequestState>,
    states: FrontRequestState<UnknownState, UnknownState, UnknownState, UnknownState, UnknownState>
  ) =>
    forEach(objectKeys(newVal), key => {
      type Keys = keyof FrontRequestState;
      states[key as Keys][1](newVal[key as Keys] as any);
    }),
  effectRequest({
    handler,
    removeStates,
    saveStates,
    immediate,
    frontStates,
    watchingStates = []
  }: EffectRequestParams<any>) {
    // 当有监听状态时，状态变化再触发
    const needEmit = useRef(immediate);
    const oldStates = watchingStates.map(s => useRef(s)); // 用于对比新旧值
    useEffect(() => {
      // 对比新旧状态，获取变化的状态索引
      let changedIndex: number | undefined = undefinedValue;
      forEach(watchingStates, (newState, i) => {
        if (!Object.is(refCurrent(oldStates[i]), newState)) {
          changedIndex = i;
          oldStates[i].current = newState;
        }
      });
      refCurrent(needEmit) ? handler(changedIndex) : setRef(needEmit, trueValue);
      return removeStates; // 组件卸载时移除对应状态
    }, watchingStates);

    // 因为react每次刷新都会重新调用usehook，因此每次会让状态缓存失效
    // 因此每次都需要更新管理的状态
    const needSave = useRef(false);
    const saveStatesFn = useCallback(saveStates, []);
    useEffect(() => {
      refCurrent(needSave) ? saveStatesFn(frontStates) : setRef(needSave, trueValue);
    });
  }
};
