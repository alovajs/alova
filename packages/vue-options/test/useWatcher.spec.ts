import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { delay } from 'root/testUtils';
import TestWatcher from './components/TestWatcher.vue';
import { createTestAlova, eventObj } from './utils';

const alovaInst = createTestAlova();
describe('vue options watcher hook', () => {
  test('should request when watching states are changed', async () => {
    const successFn = jest.fn();
    const completeFn = jest.fn();
    render(TestWatcher, {
      props: {
        methodHandler: (state1: number, state2: string) =>
          alovaInst.Get('/unit-test', {
            params: { state1, state2 }
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

    await delay(100); // 默认不发出请求，100毫秒后也是初始值
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
      expect(successFn.mock.calls[0][0].constructor.name).toBe('AlovaSuccessEvent');
      expect(completeFn.mock.calls[0][0].constructor.name).toBe('AlovaCompleteEvent');
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
      expect(successFn.mock.calls[1][0].constructor.name).toBe('AlovaSuccessEvent');
      expect(completeFn.mock.calls[1][0].constructor.name).toBe('AlovaCompleteEvent');
    });
  });

  test('should request dependent on other use hook states', async () => {
    render(TestWatcher, {
      props: {
        methodHandler: (state1: any, state2: string) =>
          alovaInst.Get('/unit-test', {
            params: { state1, state2 }
          }),
        immediate: true
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('data2')).toHaveTextContent(
        JSON.stringify({
          code: 200,
          msg: '',
          data: { path: '/unit-test', method: 'GET', params: { state1: '[object Object]', state2: 'a' } }
        })
      );
    });
  });
});
