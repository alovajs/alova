import { createSyncOnceRunner, noop } from '@alova/shared/function';
import { forEach } from '@alova/shared/vars';
import { StatesHook } from 'alova';
import { Accessor, createEffect, createMemo, createSignal, on, onCleanup, onMount } from 'solid-js';
import { SolidHookExportType } from '~/typings/stateshook/solid';

// solid hooks predefined
export default {
  name: 'Solid',
  create: data => createSignal(data),
  export: state => state[0],
  dehydrate: state => state[0](),
  update: (newVal, state) => {
    state[1](newVal);
  },
  effectRequest: ({ handler, removeStates, immediate, watchingStates = [] }) => {
    const syncRunner = createSyncOnceRunner();
    // remove states when component unmounted
    onCleanup(removeStates);
    // Execute handler immediately upon component mounting
    onMount(() => {
      immediate && handler();
    });

    forEach(watchingStates, (state: Accessor<unknown>, i) => {
      createEffect(
        on(
          state,
          () =>
            syncRunner(() => {
              handler(i);
            }),
          { defer: true }
        )
      );
    });
  },
  computed: getter => [createMemo(getter), noop],
  watch: (states, callback) => {
    const curStates = Array.isArray(states) ? states : [states];
    const syncRunner = createSyncOnceRunner();
    createEffect(
      on(
        curStates.map(state => state),
        () =>
          syncRunner(() => {
            callback();
          }),
        { defer: true }
      )
    );
  },

  onMounted: callback => {
    onMount(callback);
  },
  onUnmounted: callback => {
    onCleanup(callback);
  }
} as StatesHook<SolidHookExportType<unknown>>;
