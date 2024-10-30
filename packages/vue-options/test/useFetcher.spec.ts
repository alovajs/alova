import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import TestFetcher from './components/TestFetcher.vue';
import { createTestAlova, eventObj } from './utils';

const alovaInst = createTestAlova();
describe('vue options fetcher hook', () => {
  test('should request when watching states are changed', async () => {
    const successFn = vi.fn();
    const completeFn = vi.fn();
    render(TestFetcher, {
      props: {
        method: alovaInst.Get('/unit-test', {
          params: { a: 1, b: 'b' }
        })
      },
      ...eventObj({
        success(event: any) {
          successFn(event);
        },
        complete(event: any) {
          completeFn(event);
        }
      })
    });

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
      expect(successFn.mock.calls[0][0].constructor.name).toBe('AlovaSuccessEvent');
      expect(completeFn.mock.calls[0][0].constructor.name).toBe('AlovaCompleteEvent');
    });
  });
});
