import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react';
import { RequestState } from '../../typings';

const create = (data: any) => useState(data);
type ReactState<D> = [D, Dispatch<SetStateAction<D>>];

// React的预定义hooks
export default {
  create,
  export: <D>(state: ReactState<D>) => state[0],
  update: (newVal: Partial<RequestState>, state: RequestState<ReactState<unknown>>) => Object.keys(newVal).forEach(key => {
    type Keys = keyof RequestState;
    state[key as Keys][1](newVal[key as Keys] as any);
  }),
  effectRequest(handler: () => void, watchedStates: any[] = [], immediate = true) {
    const mountedRef = useRef(false);
    useEffect(() => {
      if (!immediate && !mountedRef.current) {
        mountedRef.current = true;
        return;
      }
      handler();
    }, watchedStates);
  },
};