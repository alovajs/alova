import { Dispatch, SetStateAction } from 'react';
import { StatesHook } from '..';

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
declare const reactHook: StatesHook<ReactState<unknown>, unknown, unknown, unknown>;
export default reactHook;
