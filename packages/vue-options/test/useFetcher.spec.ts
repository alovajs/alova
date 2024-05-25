import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { delay } from 'root/testUtils';
import TestFetcher from './components/TestFetcher.vue';
import { alovaInst } from './mockData';
import { eventObj } from './utils';

describe('vue options fetcher hook', () => {
  test('should request when watching states are changed', async () => {
    const successFn = jest.fn();
    const completeFn = jest.fn();
    render(TestFetcher as any, {
      props: {
        method: alovaInst.Get('/unit-test', {
          params: { a: 1, b: 'b' }
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
    expect(screen.getByRole('loading')).toHaveTextContent('fetched');
    expect(screen.getByRole('error')).toHaveTextContent('');
    expect(screen.getByRole('data')).toHaveTextContent('{}');

    fireEvent.click(screen.getByRole('btnFetch'));
    await waitFor(() => {
      expect(screen.getByRole('loading')).toHaveTextContent('fetched');
      expect(screen.getByRole('error')).toHaveTextContent('');
      expect(screen.getByRole('data')).toHaveTextContent(
        JSON.stringify({
          path: '/unit-test',
          method: 'GET',
          params: { a: '1', b: 'b' }
        })
      );
      expect(successFn).toHaveBeenCalledTimes(1);
      expect(completeFn).toHaveBeenCalledTimes(1);
    });
  });
});
