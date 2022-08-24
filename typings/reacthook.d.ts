import { Dispatch, SetStateAction } from 'react';
import { EffectRequestParams, FrontRequestState } from '.';

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
type UnknownState = ReactState<unknown>;
interface ReactHook {
  create: (data: any) => ReactState<any>;
  export: <D>(state: ReactState<D>) => D;
  dehydrate: <D>(state: ReactState<D>) => D;
  update: (newVal: Partial<FrontRequestState>, states: FrontRequestState<UnknownState, UnknownState, UnknownState, UnknownState, UnknownState>) => void;
  effectRequest(effectRequestParams: EffectRequestParams): void;
}
declare const reactHook: ReactHook;
export default reactHook;