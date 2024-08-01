// import '@testing-library/jest-dom/vitest';
import {
  Accessor,
  createEffect,
  createMemo,
  createRenderEffect,
  createRoot,
  createSignal,
  getOwner,
  on,
  onCleanup
} from 'solid-js';
import { cleanup, render, renderDirective, testEffect } from './index';

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      noArgDirective: boolean;
      argDirective: string;
    }
  }
}

test('testEffect allows testing an effect asynchronously----computed', () =>
  new Promise<void>(resolve => {
    const mycomputed = (getter: () => any) => createMemo(getter);
    createRoot(dispose => {
      const [count, setCount] = createSignal(1);
      const computedGetter = mycomputed(() => count() * 2);
      // 在 createEffect 外部进行初始值断言
      expect(computedGetter()).toBe(2);
      createEffect(() => {
        expect(computedGetter()).toBe(4); // count 更新后，computed 应更新为 4
        resolve(); // 测试完成，返回 Promise
        dispose(); // 手动清理上下文，防止后续的更新
      });
      // 更新 count 值
      setCount(2);
    });
    cleanup(); // 清理测试环境
  }));
test('testEffect allows testing an effect asynchronously----watch', () => {
  const argDirective = (ref: HTMLSpanElement, arg: Accessor<string>) => {
    createEffect(() => {
      ref.dataset.directive = arg();
    });
  };
  const mywatch = (states: Accessor<unknown> | Accessor<unknown>[], callback: () => void) => {
    const curStates = Array.isArray(states) ? states : [states];
    createEffect(
      on(
        curStates.map(state => state),
        callback,
        { defer: true }
      )
    );
  };
  const [count, setCount] = createSignal(1);
  const { asFragment, setArg } = renderDirective(argDirective, {
    initialValue: 'initial value',
    targetElement: 'span'
  });
  mywatch(count, () => {
    setArg('updated value');
  });
  expect(asFragment()).toBe('<span data-directive="initial value"></span>');
  setCount(2);
  expect(asFragment()).toBe('<span data-directive="updated value"></span>');
});
test('testEffect allows testing an effect asynchronously----onMounted', () => {
  // 定义 myOnMounted 函数，并明确返回类型为 void
  const myOnMounted = (callback: () => void): void => {
    createEffect(callback);
  };

  const cb = vi.fn();

  function Comp() {
    myOnMounted(cb);
    const [count, setCount] = createSignal(1);
    setCount(2);
    return count();
  }
  render(() => <Comp />);
  expect(cb).toHaveBeenCalledTimes(1);
});
test('testEffect effectRequest', () => {
  interface EffectData {
    handler: (...args: any[]) => void;
    removeStates: () => void;
    immediate: boolean;
    watchingStates: Accessor<any>[];
  }
  const createSyncOnceRunner = (delay = 0) => {
    let timer: any;
    // 执行多次调用此函数将异步执行一次
    return (fn: any) => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(fn, delay);
    };
  };
  const forEach = (ary: any[], fn: any) => ary.forEach(fn);
  const EffectRequest = ({ handler, removeStates, immediate, watchingStates }: EffectData): void => {
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
      const timer: any = undefined;
      setTimeout(() => {
        immediate && handler();
        if (timer) {
          clearTimeout(timer);
        }
      });
    }

    forEach(watchingStates, (state: Accessor<unknown>, i: number) => {
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
  };
  const [count, setCount] = createSignal(1);
  const [status, setStatus] = createSignal(1);

  const data = {
    handler: (i?: number) => {
      setStatus(pre => (i === 0 ? i + 100 : pre + 1));
    },
    removeStates: () => {},
    immediate: true,
    watchingStates: [count]
  };

  EffectRequest(data);
  return testEffect(done =>
    createEffect((run: number = 0) => {
      if (run === 0) {
        expect(status()).toBe(2);
        setCount(2);
      } else if (run === 1) {
        expect(status()).toBe(100);
        done();
      }
      return run + 1;
    })
  );
});

test('testEffect catches errors', () => {
  const [value, setValue] = createSignal<{ error: string } | null>({ error: 'not yet' });
  return testEffect(done =>
    createEffect((run: number = 0) => {
      value()!.error;
      if (run === 0) {
        setValue(null);
      }
      if (run === 1) {
        done();
      }
      return run + 1;
    })
  )
    .then(() => {
      throw new Error('Error swallowed by testEffect!');
    })
    .catch((e: Error) => expect(e.name).toBe('TypeError'));
});

test('testEffect runs with owner', () => {
  const [owner, dispose] = createRoot(dispose => [getOwner(), dispose]);
  return testEffect(
    done =>
      createEffect(() => {
        expect(getOwner()!.owner).toBe(owner);
        dispose();
        done();
      }),
    owner!
  );
});
