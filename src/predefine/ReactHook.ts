import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react';
import { FrontRequestState } from '../../typings';

const create = (data: any) => useState(data);
type ReactState<D> = [D, Dispatch<SetStateAction<D>>];

// React的预定义hooks
export default {
  create,
  export: <D>(state: ReactState<D>) => state[0],
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