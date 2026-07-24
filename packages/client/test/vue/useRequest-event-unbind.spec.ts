import { useRequest } from '@/index';
import VueHook from '@/statesHook/vue';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createAlova } from 'alova';
import { delay } from 'root/testUtils';
import { defineComponent, h, inject, provide, ref } from 'vue';
import { mockRequestAdapter } from '~/test/mockData';

const alovaInst = createAlova({
  baseURL: 'http://localhost:8080',
  statesHook: VueHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});

/**
 * Regression tests for the memory-leak issue where `onSuccess`/`onError`/`onComplete`
 * handlers registered by descendant components (via provide/inject) were never unbound
 * from the parent request's eventManager, causing handlers to accumulate on every
 * re-render (e.g. inside a `v-for`).
 *
 * After the fix, each handler is bound to the `onUnmounted` of the component that called
 * the binder, so it is automatically removed when that component unmounts, while the
 * parent's own handlers keep firing.
 */
describe('useRequest event auto-unbind on descendant unmount', () => {
  test('onSuccess/onComplete registered by a descendant are removed on its unmount, parent handlers keep firing', async () => {
    const parentSuccess = vi.fn();
    const childSuccess = vi.fn();
    const parentComplete = vi.fn();
    const childComplete = vi.fn();
    let sendFn!: (...args: any[]) => any;

    const Child = defineComponent({
      setup() {
        const { onSuccess, onComplete } = inject<any>('req');
        onSuccess(() => childSuccess());
        onComplete(() => childComplete());
        return () => h('span', 'child');
      }
    });

    const Parent = defineComponent({
      setup() {
        const Get = alovaInst.Get('/info-list', { cacheFor: 0 });
        const { send, onSuccess, onComplete } = useRequest(Get);
        sendFn = send;
        onSuccess(() => parentSuccess());
        onComplete(() => parentComplete());
        provide('req', { onSuccess, onComplete });
        const showChild = ref(true);
        const removeChild = () => {
          showChild.value = false;
        };
        return () => h('div', [h('button', { onClick: removeChild }, 'toggle'), showChild.value ? h(Child) : null]);
      }
    });

    const { unmount } = render(Parent);

    // The immediate request fires on mount: both parent and child handlers are called.
    await waitFor(() => expect(parentSuccess).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(childSuccess).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(parentComplete).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(childComplete).toHaveBeenCalledTimes(1));

    // Unmount the descendant component.
    await fireEvent.click(screen.getByText('toggle'));
    await delay(10);

    // Trigger another request manually.
    sendFn();
    await waitFor(() => expect(parentSuccess).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(parentComplete).toHaveBeenCalledTimes(2));

    // The descendant handlers must NOT be called again after its unmount.
    expect(childSuccess).toHaveBeenCalledTimes(1);
    expect(childComplete).toHaveBeenCalledTimes(1);

    unmount();
  });

  test('onError registered by a descendant is removed on its unmount', async () => {
    const parentError = vi.fn();
    const childError = vi.fn();
    let sendFn!: (...args: any[]) => any;

    const Child = defineComponent({
      setup() {
        const { onError } = inject<any>('req');
        onError(() => childError());
        return () => h('span', 'child');
      }
    });

    const Parent = defineComponent({
      setup() {
        const Get = alovaInst.Get('/list-error', { cacheFor: 0 });
        const { send, onError } = useRequest(Get);
        sendFn = send;
        onError(() => parentError());
        provide('req', { onError });
        const showChild = ref(true);
        const removeChild = () => {
          showChild.value = false;
        };
        return () => h('div', [h('button', { onClick: removeChild }, 'toggle'), showChild.value ? h(Child) : null]);
      }
    });

    const { unmount } = render(Parent);

    await waitFor(() => expect(parentError).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(childError).toHaveBeenCalledTimes(1));

    await fireEvent.click(screen.getByText('toggle'));
    await delay(10);

    // The manual re-request rejects with a 500. Await it and swallow the
    // rejection so it doesn't surface as an unhandled rejection (the error
    // event itself is already verified via the `onError` handlers above).
    await sendFn().catch(() => {});
    await waitFor(() => expect(parentError).toHaveBeenCalledTimes(2));
    expect(childError).toHaveBeenCalledTimes(1);

    unmount();
  });

  test('handlers registered by multiple descendants (v-for like) are each removed on their own unmount', async () => {
    const parentSuccess = vi.fn();
    const childSuccessA = vi.fn();
    const childSuccessB = vi.fn();
    let sendFn!: (...args: any[]) => any;

    // Stable component types (must NOT be recreated on every re-render, otherwise
    // Vue remounts the child and re-registers the handler).
    const makeChild = (mark: () => void) =>
      defineComponent({
        setup() {
          const { onSuccess } = inject<any>('req');
          onSuccess(() => mark());
          return () => h('span', 'child');
        }
      });
    const ChildA = makeChild(childSuccessA);
    const ChildB = makeChild(childSuccessB);

    const Parent = defineComponent({
      setup() {
        const Get = alovaInst.Get('/info-list', { cacheFor: 0 });
        const { send, onSuccess } = useRequest(Get);
        sendFn = send;
        onSuccess(() => parentSuccess());
        provide('req', { onSuccess });
        const showA = ref(true);
        const showB = ref(true);
        const removeA = () => {
          showA.value = false;
        };
        const removeB = () => {
          showB.value = false;
        };
        return () =>
          h('div', [
            h('button', { onClick: removeA }, 'removeA'),
            h('button', { onClick: removeB }, 'removeB'),
            showA.value ? h(ChildA) : null,
            showB.value ? h(ChildB) : null
          ]);
      }
    });

    const { unmount } = render(Parent);

    // Both descendants are mounted and registered their handlers.
    await waitFor(() => expect(parentSuccess).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(childSuccessA).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(childSuccessB).toHaveBeenCalledTimes(1));

    // Unmount only descendant A.
    await fireEvent.click(screen.getByText('removeA'));
    await delay(10);

    sendFn();
    await waitFor(() => expect(parentSuccess).toHaveBeenCalledTimes(2));
    // Only descendant B should still fire; A must not.
    await waitFor(() => expect(childSuccessB).toHaveBeenCalledTimes(2));
    expect(childSuccessA).toHaveBeenCalledTimes(1);

    // Unmount descendant B as well.
    await fireEvent.click(screen.getByText('removeB'));
    await delay(10);

    sendFn();
    await waitFor(() => expect(parentSuccess).toHaveBeenCalledTimes(3));
    expect(childSuccessA).toHaveBeenCalledTimes(1);
    expect(childSuccessB).toHaveBeenCalledTimes(2);

    unmount();
  });
});
