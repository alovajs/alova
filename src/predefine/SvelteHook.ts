import { onDestroy } from 'svelte';
import { writable, Writable } from 'svelte/store';
import { EffectRequestParams } from '~/typings';
import {
  clearTimeoutTimer,
  falseValue,
  forEach,
  isSSR,
  objectKeys,
  setTimeoutFn,
  trueValue,
  undefinedValue
} from '../utils/variables';

type UnknownWritable = Writable<unknown>;
export default {
  create: <D>(data: D): Writable<D> => writable(data),
  export: <D>(state: Writable<D>) => state,
  dehydrate: <D>(state: Writable<D>) => {
    let raw;
    // 订阅时会立即执行一次函数，获取到值后立即调用解除订阅函数
    state.subscribe(value => (raw = value))();
    return raw;
  },
  update: (newVal: Record<string, any>, states: Record<string, UnknownWritable>) =>
    forEach(objectKeys(newVal), key => {
      const sItem = states[key];
      sItem.set(newVal[key]);
    }),
  effectRequest({ handler, removeStates, immediate, watchingStates }: EffectRequestParams<Writable<any>>) {
    // 在服务端渲染时不发送请求
    if (isSSR) {
      return;
    }

    // 组件卸载时移除对应状态
    onDestroy(removeStates);
    immediate && handler();
    let timer: any,
      needEmit = falseValue;
    forEach(watchingStates || [], (state, i) => {
      state.subscribe(() => {
        timer && clearTimeoutTimer(timer);
        timer = setTimeoutFn(() => {
          // svelte的writable默认会触发一次，因此当immediate为false时需要过滤掉第一次触发调用
          needEmit ? handler(i) : (needEmit = trueValue);
          timer = undefinedValue;
        }, 10);
      });
    });
  }
};
