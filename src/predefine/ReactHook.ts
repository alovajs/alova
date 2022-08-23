import {
  Dispatch,
  SetStateAction,
  // useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import { EffectRequestParams, FrontRequestState } from '../../typings';
import { forEach, objectKeys, trueValue } from '../utils/variables';

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
const stateToData = <D>([ state ]: ReactState<D>) => state;
type UnknownState = ReactState<unknown>;

// React的预定义hooks
export default {
  create: (data: any) => useState(data),
  export: stateToData,
  dehydrate: stateToData,
  update: (newVal: Partial<FrontRequestState>, states: FrontRequestState<UnknownState, UnknownState, UnknownState, UnknownState, UnknownState>) => forEach(
    objectKeys(newVal), 
    key => {
      type Keys = keyof FrontRequestState;
      states[key as Keys][1](newVal[key as Keys] as any);
    }
  ),
  effectRequest({
    handler,
    removeStates,
    // saveStates,
    immediate,
    // frontStates,
    watchStates = [],
  }: EffectRequestParams) {

    // 当有监听状态时，状态变化再触发
    const needEmit = useRef(immediate);
    useEffect(() => {
      needEmit.current ? handler() : (needEmit.current = trueValue);
      return removeStates;    // 组件卸载时移除对应状态
    }, watchStates);

    // 因为react每次刷新都会重新调用usehook，因此每次会让状态缓存失效
    // 当frontSatates变化时重新保存状态
    // const needSave = useRef(false);
    // const saveStatesFn = useCallback(saveStates, []);
    // useEffect(() => {
    //   needSave.current ? saveStatesFn(frontStates) : (needSave.current = trueValue);
    // }, Object.values(frontStates).map(([state]) => state));
  },
};