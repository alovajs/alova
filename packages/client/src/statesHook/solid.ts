import { createSyncOnceRunner, isFn } from '@alova/shared/function';
import { forEach, setTimeoutFn } from '@alova/shared/vars';
import { StatesHook } from 'alova';
import { Accessor, createEffect, createMemo, createRenderEffect, createSignal, on, onCleanup, Setter } from 'solid-js';
import { SolidHookExportType } from '~/typings/stateshook/solid';

// 定义类型
type SolidState<D> = [Accessor<D>, Setter<D>];

export default {
  name: 'Solid',
  create: <D>(data: D): SolidState<D> => createSignal(data),
  export: <D>(state: SolidState<D>): Accessor<D> => state[0],
  dehydrate: <D>(state: SolidState<D>): D => state[0](),
  // 更新状态
  update: <D>(newVal: D, state: SolidState<D>) => {
    queueMicrotask(() => {
      state[1](() => (isFn(newVal) ? newVal() : newVal)); // 确保 newVal 不是函数类型
      // state[1](newVal as Exclude<D, Function>);
    });
  },
  effectRequest: ({ handler, removeStates, immediate, watchingStates = [] }) => {
    const syncRunner = createSyncOnceRunner();
    // 判断是否在组件内部使用
    const isComponent = typeof onCleanup === 'function';
    if (isComponent) {
      // 组件卸载时移除对应状态
      onCleanup(removeStates);
      // 组件挂载时立即执行 handler
      createRenderEffect(() => {
        immediate && handler();
      });
    } else {
      // 非组件内部使用，使用定时器延迟执行
      setTimeoutFn(() => {
        immediate && handler();
      });
    }

    forEach(watchingStates, (state: Accessor<unknown>, i?: number) => {
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
  computed: (getter, depList) => {
    const memo = createMemo(getter, depList);
    return memo;
  },
  watch: (states: Accessor<any>[], callback) => {
    createEffect(
      on(
        states.map(state => state),
        callback,
        { defer: true }
      )
    );
  },

  onMounted: (callback: () => void) => {
    createRenderEffect(() => {
      callback();
    });
  },
  onUnmounted: (callback: () => void) => {
    onCleanup(callback);
  }
} as StatesHook<SolidHookExportType<unknown>>;
