import { mockRequestAdapter } from '#/mockData';
import { useRequest } from '@/index';
import reactHook from '@/statesHook/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createAlova } from 'alova';
import { createContext, useContext, useMemo, useState } from 'react';
import { delay } from 'root/testUtils';

const alovaInst = createAlova({
  baseURL: process.env.NODE_BASE_URL,
  statesHook: reactHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});

/**
 * React port of the Vue `useRequest-event-unbind` regression tests.
 *
 * In React `createRequestState` runs on every render and `onUnmounted` is
 * implemented as `useEffect(() => callback, [])`, so each binder (`onSuccess`
 * / `onError` / `onComplete`) must be called during the render phase. Doing so
 * registers its own unmount cleanup that removes the handler from the request's
 * eventManager. When the component that registered the handler unmounts, the
 * handler must be released so it no longer fires on later requests — while the
 * parent's own handlers keep firing.
 *
 * React Context plays the role of Vue's provide/inject: the parent exposes the
 * binders through context and descendant components register their own handlers
 * via it.
 */
const ReqContext = createContext<{
  onSuccess: (handler: () => void) => void;
  onError: (handler: () => void) => void;
  onComplete: (handler: () => void) => void;
} | null>(null);
const useReq = () => useContext(ReqContext)!;

describe('useRequest event auto-unbind on descendant unmount (react)', () => {
  test('onSuccess/onComplete registered by a descendant are removed on its unmount, parent handlers keep firing', async () => {
    const parentSuccess = vi.fn();
    const childSuccess = vi.fn();
    const parentComplete = vi.fn();
    const childComplete = vi.fn();

    const Child = ({ markSuccess, markComplete }: { markSuccess: () => void; markComplete: () => void }) => {
      // Binders MUST be called during render (the React render phase), otherwise
      // they would invoke `useEffect` outside of render and crash with
      // "Invalid hook call".
      const { onSuccess, onComplete } = useReq();
      onSuccess(markSuccess);
      onComplete(markComplete);
      return <span>child</span>;
    };

    const Parent = () => {
      const Get = alovaInst.Get('/info-list', { cacheFor: 0 });
      const { send, onSuccess, onComplete } = useRequest(Get);
      onSuccess(parentSuccess);
      onComplete(parentComplete);
      const [showChild, setShowChild] = useState(true);
      const reqContextValue = useMemo(() => ({ onSuccess, onError: () => {}, onComplete }), [onSuccess, onComplete]);
      return (
        <ReqContext.Provider value={reqContextValue}>
          <button onClick={() => setShowChild(false)}>toggle</button>
          <button onClick={() => send()}>send</button>
          {showChild ? (
            <Child
              markSuccess={childSuccess}
              markComplete={childComplete}
            />
          ) : null}
        </ReqContext.Provider>
      );
    };

    const { unmount } = render(<Parent />);

    // The immediate request fires on mount: both parent and child handlers are called.
    await waitFor(() => expect(parentSuccess).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(childSuccess).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(parentComplete).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(childComplete).toHaveBeenCalledTimes(1));

    // Unmount the descendant component.
    fireEvent.click(screen.getByText('toggle'));
    await delay(10);

    // Trigger another request manually.
    fireEvent.click(screen.getByText('send'));
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

    const Child = ({ mark }: { mark: () => void }) => {
      const { onError } = useReq();
      onError(mark);
      return <span>child</span>;
    };

    const Parent = () => {
      const Get = alovaInst.Get('/list-error', { cacheFor: 0 });
      const { send, onError } = useRequest(Get);
      onError(parentError);
      const [showChild, setShowChild] = useState(true);
      const reqContextValue = useMemo(() => ({ onSuccess: () => {}, onError, onComplete: () => {} }), [onError]);
      return (
        <ReqContext.Provider value={reqContextValue}>
          <button onClick={() => setShowChild(false)}>toggle</button>
          <button onClick={() => send().catch(() => {})}>send</button>
          {showChild ? <Child mark={childError} /> : null}
        </ReqContext.Provider>
      );
    };

    const { unmount } = render(<Parent />);

    await waitFor(() => expect(parentError).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(childError).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('toggle'));
    await delay(10);

    // The manual re-request rejects with a 500. Await it and swallow the
    // rejection so it doesn't surface as an unhandled rejection (the error
    // event itself is already verified via the `onError` handlers above).
    fireEvent.click(screen.getByText('send'));
    await waitFor(() => expect(parentError).toHaveBeenCalledTimes(2));
    expect(childError).toHaveBeenCalledTimes(1);

    unmount();
  });

  test('handlers registered by multiple descendants (v-for like) are each removed on their own unmount', async () => {
    const parentSuccess = vi.fn();
    const childSuccessA = vi.fn();
    const childSuccessB = vi.fn();

    // Stable component types (must NOT be recreated on every re-render).
    const ChildA = ({ mark }: { mark: () => void }) => {
      const { onSuccess } = useReq();
      onSuccess(mark);
      return <span>childA</span>;
    };
    const ChildB = ({ mark }: { mark: () => void }) => {
      const { onSuccess } = useReq();
      onSuccess(mark);
      return <span>childB</span>;
    };

    const Parent = () => {
      const Get = alovaInst.Get('/info-list', { cacheFor: 0 });
      const { send, onSuccess } = useRequest(Get);
      onSuccess(parentSuccess);
      const [showA, setShowA] = useState(true);
      const [showB, setShowB] = useState(true);
      const reqContextValue = useMemo(() => ({ onSuccess, onError: () => {}, onComplete: () => {} }), [onSuccess]);
      return (
        <ReqContext.Provider value={reqContextValue}>
          <button onClick={() => setShowA(false)}>removeA</button>
          <button onClick={() => setShowB(false)}>removeB</button>
          <button onClick={() => send()}>send</button>
          {showA ? <ChildA mark={childSuccessA} /> : null}
          {showB ? <ChildB mark={childSuccessB} /> : null}
        </ReqContext.Provider>
      );
    };

    const { unmount } = render(<Parent />);

    // Both descendants are mounted and registered their handlers.
    await waitFor(() => expect(parentSuccess).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(childSuccessA).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(childSuccessB).toHaveBeenCalledTimes(1));

    // Unmount only descendant A.
    fireEvent.click(screen.getByText('removeA'));
    await delay(10);

    fireEvent.click(screen.getByText('send'));
    await waitFor(() => expect(parentSuccess).toHaveBeenCalledTimes(2));
    // Only descendant B should still fire; A must not.
    await waitFor(() => expect(childSuccessB).toHaveBeenCalledTimes(2));
    expect(childSuccessA).toHaveBeenCalledTimes(1);

    // Unmount descendant B as well.
    fireEvent.click(screen.getByText('removeB'));
    await delay(10);

    fireEvent.click(screen.getByText('send'));
    await waitFor(() => expect(parentSuccess).toHaveBeenCalledTimes(3));
    expect(childSuccessA).toHaveBeenCalledTimes(1);
    expect(childSuccessB).toHaveBeenCalledTimes(2);

    unmount();
  });
});
