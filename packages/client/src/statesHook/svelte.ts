import { createSyncOnceRunner } from '@alova/shared/function';
import { falseValue, forEach, trueValue } from '@alova/shared/vars';
import { StatesHook } from 'alova';
import { onDestroy, onMount } from 'svelte';
import { derived, writable } from 'svelte/store';
import { SvelteHookExportType } from '~/typings/stateshook/svelte';

export default {
  name: 'Svelte',
  create: data => writable(data),
  dehydrate: state => {
    let raw;
    // 订阅时会立即执行一次函数，获取到值后立即调用解除订阅函数
    state.subscribe(value => {
      raw = value;
    })();
    return raw;
  },
  update: (newVal, state) => {
    state.set(newVal);
  },
  effectRequest({ handler, removeStates, immediate, watchingStates }) {
    // 组件卸载时移除对应状态
    onDestroy(removeStates);
    onMount(() => immediate && handler());

    let needEmit = falseValue;
    const syncRunner = createSyncOnceRunner(10);
    forEach(watchingStates || [], (state, i) => {
      state.subscribe(() => {
        syncRunner(() => {
          // svelte的writable默认会触发一次，因此当immediate为false时需要过滤掉第一次触发调用
          needEmit ? handler(i) : (needEmit = trueValue);
        });
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
} as StatesHook<SvelteHookExportType<unknown>>;
