import { ComputedRef, Ref, WatchSource } from 'vue';
import { StatesHook } from '..';

declare const vueHook: StatesHook<Ref, ComputedRef, (WatchSource<any> | object)[]>;
export default vueHook;
