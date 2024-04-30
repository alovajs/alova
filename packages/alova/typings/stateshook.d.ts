import { Dispatch, SetStateAction } from 'react';
import { Writable } from 'svelte/store';
import { Ref, WatchSource } from 'vue';
import { EffectRequestParams } from '.';

interface VueHook {
  create: <D>(data: D) => Ref<D>;
  export: <D>(state: Ref<D>) => Ref<D>;
  dehydrate: <D>(state: Ref<D>) => D;
  update: (newVal: Record<string, any>, states: Record<string, Ref<unknown>>) => void;
  effectRequest(effectRequestParams: EffectRequestParams<WatchSource<any> | object>): void;
}
/**
 * Vue3 states hook
 */
export declare const vue: VueHook;

type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
type UnknownState = ReactState<unknown>;
interface ReactHook {
  create: (data: any) => ReactState<any>;
  export: <D>(state: ReactState<D>) => D;
  dehydrate: <D>(state: ReactState<D>) => D;
  update: (newVal: Record<string, any>, states: Record<string, UnknownState>) => void;
  effectRequest(effectRequestParams: EffectRequestParams<any>): void;
}
/**
 * react states hook
 */
export declare const react: ReactHook;

type UnknownWritable = Writable<unknown>;
interface SvelteHook {
  create: <D>(data: D) => Writable<D>;
  export: <D>(state: Writable<D>) => Writable<D>;
  dehydrate: <D>(state: Writable<D>) => D;
  update: (newVal: Record<string, any>, states: Record<string, UnknownWritable>) => void;
  effectRequest(effectRequestParams: EffectRequestParams<Writable<any>>): void;
}
/**
 * Svelte states hook
 */
export declare const svelte: SvelteHook;
