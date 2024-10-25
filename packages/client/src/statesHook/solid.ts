import { createSyncOnceRunner, noop } from '@alova/shared/function';
import { forEach, setTimeoutFn } from '@alova/shared/vars';
import { StatesHook } from 'alova';
import { Accessor, createEffect, createMemo, createSignal, on, onCleanup, onMount } from 'solid-js';
import { SolidHookExportType } from '~/typings/stateshook/solid';

// 定义类型
export default {
  name: 'Solid',
  create: data => createSignal(data),
  export: state => state[0],
  dehydrate: state => state[0](),
  // 更新状态
  update: (newVal, state) => {
    state[1](newVal); // 确保 newVal 不是函数类型
  },
  effectRequest: ({ handler, removeStates, immediate, watchingStates = [] }) => {
    const syncRunner = createSyncOnceRunner();
    // 判断是否在组件内部使用
    const isComponent = typeof onCleanup === 'function';
    if (isComponent) {
      // 组件卸载时移除对应状态
      onCleanup(removeStates);
      // 组件挂载时立即执行 handler
      onMount(() => {
        immediate && handler();
      });
    } else {
      // 非组件内部使用，使用定时器延迟执行
      setTimeoutFn(() => {
        immediate && handler();
      });
    }

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
    createEffect(
      on(
        curStates.map(state => state),
        callback,
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
