import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { delay } from 'root/testUtils';
import TestWatcher from './components/TestWatcher.vue';
import { alovaInst } from './mockData';
import { eventObj } from './utils';

describe('vue options watcher hook', () => {
  test('should request when watching states are changed', async () => {
    const successFn = jest.fn();
    const completeFn = jest.fn();
    render(TestWatcher as any, {
      props: {
        methodHandler: (state1: number, state2: string) =>
          alovaInst.Get('/unit-test', {
            params: { state1, state2 }
          })
      },
      ...eventObj({
        success(event: any) {
          successFn();
          expect(event[Symbol.toStringTag]).toBe('AlovaSuccessEvent');
        },
        complete(event: any) {
          completeFn();
          expect(event[Symbol.toStringTag]).toBe('AlovaCompleteEvent');
        }
      })
    });

    await delay(100);
    expect(screen.getByRole('loading')).toHaveTextContent('loaded');
    expect(screen.getByRole('error')).toHaveTextContent('');
    expect(screen.getByRole('data')).toHaveTextContent('{}');

    fireEvent.click(screen.getByRole('btn1'));
    await waitFor(() => {
      expect(screen.getByRole('loading')).toHaveTextContent('loaded');
      expect(screen.getByRole('error')).toHaveTextContent('');
      expect(screen.getByRole('data')).toHaveTextContent(
        JSON.stringify({
          path: '/unit-test',
          method: 'GET',
          params: { state1: '1', state2: 'a' }
        })
      );
      expect(successFn).toHaveBeenCalledTimes(1);
      expect(completeFn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    await waitFor(() => {
      expect(screen.getByRole('loading')).toHaveTextContent('loaded');
      expect(screen.getByRole('error')).toHaveTextContent('');
      expect(screen.getByRole('data')).toHaveTextContent(
        JSON.stringify({
          path: '/unit-test',
          method: 'GET',
          params: { state1: '2', state2: 'aa' }
        })
      );
      expect(successFn).toHaveBeenCalledTimes(2);
      expect(completeFn).toHaveBeenCalledTimes(2);
    });
  });
});
