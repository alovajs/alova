import { Dispatch, SetStateAction } from 'react';
import { StatesHook } from '..';

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
declare const reactHook: StatesHook<ReactState<unknown>, any[], unknown, unknown>;
export default reactHook;
