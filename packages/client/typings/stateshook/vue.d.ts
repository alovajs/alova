import { ComputedRef, Ref, WatchSource } from 'vue';
import { StatesHook } from '..';

export type VueHookType = StatesHook<Ref, ComputedRef, WatchSource<any> | object>;
declare const vueHook: VueHookType;

export default vueHook;
