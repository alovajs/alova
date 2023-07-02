import { isNumber, noop } from '@/utils/helper';
import { falseValue, forEach, mapItem, objectKeys, trueValue, undefinedValue } from '@/utils/variables';
import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { EffectRequestParams } from '~/typings';

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
type UnknownState = ReactState<unknown>;
const stateToData = <D>([state]: ReactState<D>) => state,
  refCurrent = <T>(ref: MutableRefObject<T>) => ref.current,
  setRef = <T>(ref: MutableRefObject<T>, newVal: T) => (ref.current = newVal);

// React的预定义hooks
export default {
  create: (data: any) => useState(data),
  export: stateToData,
  dehydrate: stateToData,
  update: (newVal: Record<string, any>, states: Record<string, UnknownState>) =>
    forEach(objectKeys(newVal), key => {
      states[key][1](newVal[key] as any);
    }),
  wrap: (fn: (...args: any[]) => any, isAbort = falseValue) => {
    // abort函数在react下需要使用同一个函数，否则会访问不到原abort函数
    // 其他函数使用可以访问最新状态的同一个函数
    if (!isAbort) {
      const fnRef = useRef(noop as typeof fn);
      setRef(fnRef, fn);
      fn = (...args: any[]) => refCurrent(fnRef)(...args);
    }
    return useCallback(fn, []);
  },
  effectRequest({
    handler,
    removeStates,
    saveStates,
    immediate,
    frontStates,
    watchingStates = []
  }: EffectRequestParams<any>) {
    // 当有监听状态时，状态变化再触发
    const oldStates = mapItem(watchingStates, s => useRef(s)); // 用于对比新旧值
    useEffect(() => {
      // 对比新旧状态，获取变化的状态索引
      let changedIndex: number | undefined = undefinedValue;
      forEach(watchingStates, (newState, i) => {
        if (!Object.is(refCurrent(oldStates[i]), newState)) {
          changedIndex = i;
          setRef(oldStates[i], newState);
        }
      });

      if (immediate || isNumber(changedIndex)) {
        handler(changedIndex);
      }
      // 组件卸载时移除对应状态
      return removeStates;
    }, watchingStates);

    // 因为react每次刷新都会重新调用usehook，因此每次会让状态缓存失效
    // 因此每次都需要更新管理的状态
    const needSave = useRef(false),
      saveStatesFn = useCallback(saveStates, []);
    useEffect(() => {
      refCurrent(needSave) ? saveStatesFn(frontStates) : setRef(needSave, trueValue);
    });
  }
};
