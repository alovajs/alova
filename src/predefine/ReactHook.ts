import { isNumber, noop } from '@/utils/helper';
import { forEach, mapItem, objectKeys, trueValue, undefinedValue } from '@/utils/variables';
import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { EffectRequestParams } from '~/typings';

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
type UnknownState = ReactState<unknown>;
const stateToData = <D>([state]: ReactState<D>) => state,
  refCurrent = <T>(ref: MutableRefObject<T>) => ref.current,
  setRef = <T>(ref: MutableRefObject<T>, newVal: T) => (ref.current = newVal);

// React的预定义hooks
export default {
  create: (initialValue: any) => useState(initialValue),
  export: stateToData,
  dehydrate: stateToData,
  update: (newVal: Record<string, any>, states: Record<string, UnknownState>) =>
    forEach(objectKeys(newVal), key => {
      states[key][1](newVal[key] as any);
    }),
  memorize: (fn: (...args: any[]) => any) => {
    // 使用useCallback使用同一个引用，同事通过useRef来引用最新函数
    const fnRef = useRef(noop as typeof fn);
    setRef(fnRef, fn);
    return useCallback((...args: any[]) => refCurrent(fnRef)(...args), []);
  },
  ref: (initialValue: any) => {
    const refObj = useRef(initialValue);
    refCurrent(refObj) === undefinedValue && setRef(refObj, initialValue);
    return refObj;
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
    const needSave = useRef(false);
    useEffect(() => {
      refCurrent(needSave) ? saveStates(frontStates) : setRef(needSave, trueValue);
    });
  }
};
