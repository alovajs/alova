import { accessAction, actionDelegationMiddleware, useWatcher } from '@/index';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createAlova } from 'alova';
import ReactHook from 'alova/react';
import { ReactElement, StrictMode, useState } from 'react';
import { mockRequestAdapter } from '~/test/mockData';

const StrictModeReact = StrictMode as any;

const alovaInst = createAlova({
  baseURL: 'http://localhost:8080',
  statesHook: ReactHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});

describe('react => subscriber middleware', () => {
  test('should reset context after state changes', async () => {
    const successFn1 = vi.fn();
    const successFn2 = vi.fn();
    const request1 = vi.fn();
    const request2 = vi.fn();

    function Page() {
      const [name1, setName1] = useState(0);
      const [name2, setName2] = useState(0);
      const methodInstance = (params: any) =>
        alovaInst.Get('/info-list', {
          params,
          cacheFor: 0
        });

      const watcher1 = useWatcher(
        () => {
          request1(name1);
          return methodInstance({ name: name1 });
        },
        [name1],
        {
          middleware: actionDelegationMiddleware('delegate')
        }
      );
      const watcher2 = useWatcher(
        () => {
          request2(name2);
          return methodInstance({ name: name2 });
        },
        [name2],
        {
          middleware: actionDelegationMiddleware('delegate')
        }
      );

      watcher1.onSuccess(successFn1);
      watcher2.onSuccess(successFn2);

      return (
        <div role="wrap">
          <span role="status-1">{watcher1.loading ? 'loading' : 'loaded'}</span>
          <span role="status-2">{watcher2.loading ? 'loading' : 'loaded'}</span>
          <span role="name-1">{name1}</span>
          <span role="name-2">{name2}</span>
          <button
            role="btnSend1"
            onClick={() => setName1(v => v + 1)}>
            send
          </button>
          <button
            role="btnSend2"
            onClick={() => setName2(v => v + 1)}>
            send
          </button>
        </div>
      );
    }

    render(
      (
        <StrictModeReact>
          <Page />
        </StrictModeReact>
      ) as ReactElement<any, any>
    );
    await waitFor(() => {
      expect(screen.getByRole('status-1')).toHaveTextContent('loaded');
      expect(screen.getByRole('status-2')).toHaveTextContent('loaded');
    });

    // name: 1 0.
    fireEvent.click(screen.getByRole('btnSend1'));

    await waitFor(() => {
      expect(screen.getByRole('status-1')).toHaveTextContent('loaded');
      expect(screen.getByRole('name-1')).toHaveTextContent('1');
      expect(screen.getByRole('name-2')).toHaveTextContent('0');
      expect(successFn1).toHaveBeenCalledTimes(1);
      expect(successFn2).toHaveBeenCalledTimes(0);
      expect(request1).toHaveBeenCalledWith(1);
    });

    // name: 1 1
    fireEvent.click(screen.getByRole('btnSend2'));

    await waitFor(() => {
      expect(screen.getByRole('status-2')).toHaveTextContent('loaded');
      expect(screen.getByRole('name-1')).toHaveTextContent('1');
      expect(screen.getByRole('name-2')).toHaveTextContent('1');
      expect(successFn1).toHaveBeenCalledTimes(1);
      expect(successFn2).toHaveBeenCalledTimes(1);
      expect(request2).toHaveBeenCalledWith(1);
    });

    // name: 1 1
    // invoke hooks with middleware id `delegate`, should call watcher1.send and watcher2.send
    accessAction('delegate', async ({ send }) => {
      send({ fetch: 'delegate' });
    });

    await waitFor(() => {
      expect(screen.getByRole('status-1')).toHaveTextContent('loaded');
      expect(screen.getByRole('status-2')).toHaveTextContent('loaded');
      expect(screen.getByRole('name-1')).toHaveTextContent('1');
      expect(screen.getByRole('name-2')).toHaveTextContent('1');
      expect(successFn1).toHaveBeenCalledTimes(2);
      expect(successFn2).toHaveBeenCalledTimes(2);
      expect(request1).toHaveBeenCalledWith(1);
      expect(request2).toHaveBeenCalledWith(1);
    });

    // name: 1 2
    fireEvent.click(screen.getByRole('btnSend2'));

    await waitFor(() => {
      expect(screen.getByRole('status-2')).toHaveTextContent('loaded');
      expect(screen.getByRole('name-1')).toHaveTextContent('1');
      expect(screen.getByRole('name-2')).toHaveTextContent('2');
      expect(successFn1).toHaveBeenCalledTimes(2);
      expect(successFn2).toHaveBeenCalledTimes(3);
    });

    // name: 1 2
    // invoke hooks with middleware id `delegate`
    accessAction('delegate', async ({ send }) => {
      send({ fetch: 'delegate' });
    });

    await waitFor(() => {
      expect(screen.getByRole('status-1')).toHaveTextContent('loaded');
      expect(screen.getByRole('status-2')).toHaveTextContent('loaded');
      expect(screen.getByRole('name-1')).toHaveTextContent('1');
      expect(screen.getByRole('name-2')).toHaveTextContent('2');
      expect(successFn1).toHaveBeenCalledTimes(3);
      expect(successFn2).toHaveBeenCalledTimes(4);
      expect(request1).toHaveBeenCalledWith(1);
      expect(request2).toHaveBeenCalledWith(2);
    });
  });
});
