import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react';
import { FrontRequestState, WatchingParams } from '../../typings';
import { forEach, objectKeys, trueValue } from '../utils/variables';

const stateToData = <D>([ state ]: ReactState<D>) => state;
type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
type UnknownState = ReactState<unknown>;

// React的预定义hooks
export default {
  create: (data: any) => useState(data),
  export: stateToData,
  dehydrate: stateToData,
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState<UnknownState, UnknownState, UnknownState, UnknownState, UnknownState>) => forEach(
    objectKeys(newVal), 
    key => {
      type Keys = keyof FrontRequestState;
      state[key as Keys][1](newVal[key as Keys] as any);
    }
  ),
  effectRequest(handler: () => void, removeStates: () => void, { immediate, states = [] }: WatchingParams) {
    const needEmit = useRef(immediate);
    useEffect(() => {
      needEmit.current ? handler() : (needEmit.current = trueValue);
      return removeStates;    // 组件卸载时移除对应状态
    }, states);
  },
};