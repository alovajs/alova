import { createSyncOnceRunner } from '@alova/shared/function';
import { forEach } from '@alova/shared/vars';
import { StatesHook } from 'alova';
import { Accessor, createEffect, createSignal, onCleanup, Setter } from 'solidjs';
import { SolidHookExportType } from '~/typings/stateshook/solid';

// 定义类型
type SolidState<D> = [Accessor<D>, Setter<D>];

export default {
  name: 'Solid',
  create: <D>(data: D): SolidState<D> => createSignal(data),
  dehydrate: <D>(state: SolidState<D>): D => state[0](),
  update: <D>(newVal: D, state: SolidState<D>) => {
    state[1](newVal);
  },
  effectRequest: ({
    handler,
    removeStates,
    immediate,
    watchingStates = []
  }: {
    handler: (index?: number) => void;
    removeStates: () => void;
    immediate: boolean;
    watchingStates: SolidState<any>[];
  }) => {
    const syncRunner = createSyncOnceRunner();

    createEffect(() => {
      if (immediate) {
        handler();
      }
    });

    forEach(watchingStates, (state: any, i?: number) => {
      createEffect(() => {
        state[0](); // getter触发effect
        syncRunner(() => {
          handler(i);
        });
      });
    });

    // 在组件卸载时移除对应状态
    onCleanup(removeStates);
  },
  computed: <D>(getter: () => D): Accessor<D> => {
    const [value, setValue] = createSignal(getter());
    createEffect(() => {
      setValue(getter());
    });
    return value;
  },
  watch: (states: SolidState<any>[], callback: () => void) => {
    createEffect(() => {
      states.forEach(state => state[0]()); // 访问所有getter触发effect
      callback();
    });
  },
  onMounted: (callback: () => void) => {
    createEffect(() => {
      callback();
    });
  },
  onUnmounted: (callback: () => void) => {
    onCleanup(callback);
  }
} as StatesHook<SolidHookExportType<unknown>>;
