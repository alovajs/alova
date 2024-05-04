import { createSyncOnceRunner } from '@alova/shared/function';
import {
  clearTimeoutTimer,
  falseValue,
  forEach,
  objectKeys,
  setTimeoutFn,
  trueValue,
  undefinedValue
} from '@alova/shared/vars';
import { onDestroy, onMount } from 'svelte';
import { Readable, Writable, derived, writable } from 'svelte/store';
import { StatesHook } from '~/typings';

type UnknownWritable = Writable<unknown>;
export default {
  create: data => writable(data),
  dehydrate: state => {
    let raw;
    // 订阅时会立即执行一次函数，获取到值后立即调用解除订阅函数
    state.subscribe(value => (raw = value))();
    return raw;
  },
  update: (newVal, states) => {
    forEach(objectKeys(newVal), key => {
      const sItem = states[key];
      sItem.set(newVal[key]);
    });
  },
  effectRequest({ handler, removeStates, immediate, watchingStates }) {
    // 组件卸载时移除对应状态
    onDestroy(removeStates);
    onMount(() => immediate && handler());

    let timer: any;
    let needEmit = falseValue;
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
  },
  computed: (getter, depList) => derived(depList, getter),
  watch: (states, callback) => {
    let needEmit = falseValue;
    const syncRunner = createSyncOnceRunner();
    states.forEach(state => {
      state.subscribe(() => {
        syncRunner(() => {
          needEmit ? callback() : (needEmit = trueValue);
        });
      });
    });
  },
  onMounted: callback => {
    onMount(callback);
  },
  onUnmounted: callback => {
    onDestroy(callback);
  }
} as StatesHook<UnknownWritable, Readable<unknown>>;
