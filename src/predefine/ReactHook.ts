import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react';
import { FrontRequestState } from '../../typings';
import { falseValue, forEach, objectKeys, trueValue } from '../utils/variables';

const stateToData = <D>([ state ]: ReactState<D>) => state;
type ReactState<D> = [D, Dispatch<SetStateAction<D>>];

// React的预定义hooks
export default {
  create: (data: any) => useState(data),
  export: stateToData,
  dehydrate: stateToData,
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState<ReactState<unknown>>) => forEach(
    objectKeys(newVal), 
    key => {
      type Keys = keyof FrontRequestState;
      state[key as Keys][1](newVal[key as Keys] as any);
    }
  ),
  effectRequest(handler: () => void, removeStates: () => void, watchedStates: any[] = [], immediate = trueValue) {
    const mountedRef = useRef(falseValue);
    useEffect(() => {
      if (!immediate && !mountedRef.current) {
        mountedRef.current = trueValue;
        return;
      }
      handler();
      return removeStates;    // 组件卸载时移除对应状态
    }, watchedStates);
  },
};