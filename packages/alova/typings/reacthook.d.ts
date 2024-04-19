import { Dispatch, SetStateAction } from 'react';
import { EffectRequestParams } from '.';

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
type UnknownState = ReactState<unknown>;
interface ReactHook {
  create: (data: any) => ReactState<any>;
  export: <D>(state: ReactState<D>) => D;
  dehydrate: <D>(state: ReactState<D>) => D;
  update: (newVal: Record<string, any>, states: Record<string, UnknownState>) => void;
  effectRequest(effectRequestParams: EffectRequestParams<any>): void;
}
declare const reactHook: ReactHook;
export default reactHook;
