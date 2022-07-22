import { onDestroy } from 'svelte';
import { writable, derived, Readable } from 'svelte/store';
import { FrontRequestState, WatchingParams } from '../../typings';
import { forEach, objectKeys } from '../utils/variables';


// svelte的预定义hooks
interface SvelteState<D> extends Readable<D> {
  value: D;
  set(this: void, value: D): void;
}
export default {
  create: <D>(data: D): SvelteState<D> => {
    const { subscribe, set } = writable(data);
    return {
      value: data,
      subscribe,
      set
    }
  },
  export: <D>(state: SvelteState<D>) => derived(state, $state => $state),
  dehydrate: <D>(state: SvelteState<D>) => state.value,
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState<SvelteState<unknown>>) => forEach(
    objectKeys(newVal), 
    key => {
      type Keys = keyof FrontRequestState;
      state[key as Keys].value = newVal[key as Keys];
    }
  ),
  effectRequest(handler: () => void, removeStates: () => void, { states, immediate }: WatchingParams) {
    onDestroy(removeStates);    // 组件卸载时移除对应状态
    if (!states) {
      handler();
      return;
    }

    immediate && handler();
    let timer: any;
    states.forEach(state => {
      state.subscribe(() => {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
          handler();
          timer = undefined;
        }, 20);
      });
    });
  },
}