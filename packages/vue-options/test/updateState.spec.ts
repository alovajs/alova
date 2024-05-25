import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/vue';
import { updateState } from 'alova/client';
import { delay } from 'root/testUtils';
import TestRequest from './components/TestRequest.vue';
import { alovaInst } from './mockData';

describe('vue options updateState outside component', () => {
  test('should update state when change data by updateState', async () => {
    const Get = alovaInst.Get('/unit-test', {
      params: { a: 'a', b: 'str' }
    });
    const { unmount } = render(TestRequest as any, {
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

    const updateFn = jest.fn();
    updateState(Get, (oldVal: any) => {
      oldVal.path = '/unit-test-updated';
      oldVal.params = {};
      updateFn();
      return oldVal;
    });
    await waitFor(() => {
      expect(screen.getByRole('data')).toHaveTextContent(
        JSON.stringify({
          path: '/unit-test-updated',
          method: 'GET',
          params: {}
        })
      );
      expect(updateFn).toHaveBeenCalledTimes(1);
    });

    // 卸载后将不会匹配到对应状态了
    unmount();
    await delay(500);
    updateState(Get, (oldVal: any) => {
      updateFn();
      return oldVal;
    });
    expect(updateFn).toHaveBeenCalledTimes(1); // 本次updateState未触发，因此这边还是1
  });
});
