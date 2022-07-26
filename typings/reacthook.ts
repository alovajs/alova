import { Dispatch, SetStateAction } from 'react';
import { FrontRequestState, WatchingParams } from '.';

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
type UnknownState = ReactState<unknown>;
interface ReactHook {
  create: (data: any) => ReactState<any>;
  export: <D>(state: ReactState<D>) => D;
  dehydrate: <D>(state: ReactState<D>) => D;
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState<UnknownState, UnknownState, UnknownState, UnknownState, UnknownState>) => void;
  effectRequest(handler: () => void, removeStates: () => void, watchedStates: WatchingParams): void;
};
declare const reactHook: ReactHook;
export default reactHook;