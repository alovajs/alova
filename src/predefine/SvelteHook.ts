import { onDestroy } from 'svelte';
import { writable, Writable } from 'svelte/store';
import { FrontRequestState, EffectRequestParams } from '../../typings';
import { clearTimeoutTimer, forEach, objectKeys, setTimeoutFn, trueValue, undefinedValue } from '../utils/variables';


// svelte的预定义hooks
interface SvelteState<D> extends Writable<D> {
  val: D;
  set(this: void, val: D): void;
}
type UnknownState = SvelteState<unknown>;
export default {
  create: <D>(data: D): SvelteState<D> => {
    const { subscribe, set, update } = writable(data);
    return {
      val: data,
      subscribe,
      set,
      update,
    }
  },
  export: <D>(state: SvelteState<D>) => state,
  dehydrate: <D>(state: SvelteState<D>) => state.val,
  update: (newVal: Partial<FrontRequestState>, states: FrontRequestState<UnknownState, UnknownState, UnknownState, UnknownState, UnknownState>) => forEach(
    objectKeys(newVal), 
    key => {
      type Keys = keyof FrontRequestState;
      const sItem = states[key as Keys];
      sItem.val = newVal[key as Keys];
      sItem.set(newVal[key as Keys]);
    }
  ),
  effectRequest({
    handler,
    removeStates,
    immediate,
    watchingStates,
  }: EffectRequestParams) {
    onDestroy(removeStates);    // 组件卸载时移除对应状态
    if (!watchingStates) {
      handler();
      return;
    }

    let timer: any;
    let needEmit = immediate;
    forEach(watchingStates, state => {
      state.subscribe(() => {
        timer && clearTimeoutTimer(timer);
        timer = setTimeoutFn(() => {
          // svelte的writable默认会触发一次，因此当immediate=false时需要过滤掉第一次触发调用
          needEmit ? handler() : (needEmit = trueValue);
          timer = undefinedValue;
        }, 10);
      });
    });
  },
}