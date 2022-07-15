import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react';
import { FrontRequestState } from '../../typings';

const stateToData = <D>([ state ]: ReactState<D>) => state;
type ReactState<D> = [D, Dispatch<SetStateAction<D>>];

// React的预定义hooks
export default {
  create: (data: any) => useState(data),
  export: stateToData,
  dehydrate: stateToData,
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState<ReactState<unknown>>) => Object.keys(newVal).forEach(key => {
    type Keys = keyof FrontRequestState;
    state[key as Keys][1](newVal[key as Keys] as any);
  }),
  effectRequest(handler: () => void, removeStates: () => void, watchedStates: any[] = [], immediate = true) {
    const mountedRef = useRef(false);
    useEffect(() => {
      if (!immediate && !mountedRef.current) {
        mountedRef.current = true;
        return;
      }
      handler();
      return removeStates;    // 组件卸载时移除对应状态
    }, watchedStates);
  },
};