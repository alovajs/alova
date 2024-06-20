import { Dispatch, SetStateAction } from 'react';
import { StatesHook } from '..';

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
export type ReactHookType = StatesHook<ReactState<unknown>, any[], unknown, unknown>;
declare const reactHook: ReactHookType;

export default reactHook;
