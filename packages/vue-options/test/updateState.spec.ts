import { render, screen, waitFor } from '@testing-library/vue';
import { updateState } from 'alova/client';
import { Result, delay } from 'root/testUtils';
import TestRequest from './components/TestRequest.vue';
import { createTestAlova } from './utils';

const alovaInst = createTestAlova();
describe('vue options updateState outside component', () => {
  test('should update state when change data by updateState', async () => {
    const Get = alovaInst.Get<Result>('/unit-test', {
      params: { a: 'a', b: 'str' }
    });
    const { unmount } = render(TestRequest, {
      props: {
        method: Get
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('loading')).toHaveTextContent('loaded');
      expect(screen.getByRole('error')).toHaveTextContent('');
      expect(screen.getByRole('data')).toHaveTextContent(
        JSON.stringify({
          path: '/unit-test',
          method: 'GET',
          params: { a: 'a', b: 'str' }
        })
      );
    });

    const updateFn = vi.fn();
    updateState(Get, oldVal => {
      oldVal.data.path = '/unit-test-updated';
      oldVal.data.params = {};
      updateFn();
      return oldVal;
    });
    await waitFor(() => {
      expect(screen.getByRole('data')).toHaveTextContent(
        JSON.stringify({
          code: 200,
          msg: '',
          data: { path: '/unit-test-updated', method: 'GET', params: {} }
        })
      );
      expect(updateFn).toHaveBeenCalledTimes(1);
    });

    // 卸载后将不会匹配到对应状态了
    unmount();
    await delay(500);
    updateState(Get, oldVal => {
      updateFn();
      return oldVal;
    });
    expect(updateFn).toHaveBeenCalledTimes(1); // 本次updateState未触发，因此这边还是1
  });
});
