import { createSyncOnceRunner, falseValue, forEach, isSSR, trueValue } from '@alova/shared';
import { StatesHook } from 'alova';
import { onDestroy, onMount } from 'svelte';
import { derived, writable } from 'svelte/store';
import { SvelteHookExportType } from '~/typings/stateshook/svelte';

// the svelte predefined hooks
export default {
  name: 'Svelte',
  create: data => writable(data),
  dehydrate: state => {
    let raw;
    // The function will be executed once when subscribing, and the unsubscribe function will be called immediately after the value is obtained
    state.subscribe(value => {
      raw = value;
    })();
    return raw;
  },
  update: (newVal, state) => {
    state.set(newVal);
  },
  effectRequest({ handler, removeStates, immediate, watchingStates }) {
    // Remove the corresponding state when the component is unmounted
    !isSSR && onDestroy(removeStates);
    onMount(() => {
      immediate && handler();
    });

    forEach(watchingStates || [], (state, i) => {
      let needEmit = falseValue;
      state.subscribe(() => {
        // Svelte's `writable` will trigger once by default, so when immediate is false, you need to filter out the first trigger call
        needEmit ? handler(i) : (needEmit = trueValue);
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
    !isSSR && onDestroy(callback);
  }
} as StatesHook<SvelteHookExportType<unknown>>;
