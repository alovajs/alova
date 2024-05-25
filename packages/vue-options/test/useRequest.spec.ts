import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { mapAlovaHook } from '../src';
import RequestWithSameConfig from './components/RequestWithSameConfig.vue';
import TestRequest from './components/TestRequest.vue';
import { alovaInst } from './mockData';
import { eventObj, untilCbCalled } from './utils';

describe('vue options request hook', () => {
  test('must return object which contains use hook function and params', async () => {
    const mixins = mapAlovaHook(function () {
      return [];
    } as any);
    expect(() => {
      mixins[0].created.call({});
    }).toThrow('expect receive an object which contains use hook return values');
  });

  test('the callback of mapAlovaHook can access context in both this and the first param', async () => {
    const ctx = {};
    const mixins = mapAlovaHook(function (context) {
      expect(context).toStrictEqual(ctx);
      expect(context).toBe(this);
      return {};
    });

    mixins[0].created.call({});
  });

  test('request success useRequestOptions', async () => {
    const successFn = jest.fn();
    const completeFn = jest.fn();
    render(TestRequest as any, {
      props: {
        method: alovaInst.Get('/unit-test', {
          params: { a: 'a', b: 'str' }
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

    expect(screen.getByRole('loading')).toHaveTextContent('loading');
    expect(screen.getByRole('error')).toHaveTextContent('');
    expect(screen.getByRole('data')).toHaveTextContent('{}');

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
      expect(successFn).toHaveBeenCalledTimes(1);
      expect(completeFn).toHaveBeenCalledTimes(1);
    });
  });

  test('request error useRequestOptions', async () => {
    const errorFn = jest.fn();
    const completeFn = jest.fn();
    render(TestRequest as any, {
      props: {
        method: alovaInst.Get('/unit-test-error')
      },
      ...eventObj({
        error(event: any) {
          errorFn();
          expect(event[Symbol.toStringTag]).toBe('AlovaErrorEvent');
        },
        complete(event: any) {
          completeFn();
          expect(event[Symbol.toStringTag]).toBe('AlovaCompleteEvent');
        }
      })
    });

    expect(screen.getByRole('loading')).toHaveTextContent('loading');
    expect(screen.getByRole('error')).toHaveTextContent('');
    expect(screen.getByRole('data')).toHaveTextContent('{}');
    await waitFor(() => {
      expect(screen.getByRole('loading')).toHaveTextContent('loaded');
      expect(screen.getByRole('error')).toHaveTextContent('api error');
      expect(screen.getByRole('data')).toHaveTextContent('{}');
      expect(errorFn).toHaveBeenCalledTimes(1);
      expect(completeFn).toHaveBeenCalledTimes(1);
    });
  });

  test('should send request when call xxx$send', async () => {
    const successFn = jest.fn();
    const completeFn = jest.fn();
    render(TestRequest as any, {
      props: {
        method: alovaInst.Get('/unit-test'),
        immediate: false
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

    await untilCbCalled(setTimeout, 100); // 100毫秒后仍然还是初始化状态
    expect(screen.getByRole('loading')).toHaveTextContent('loaded');
    expect(screen.getByRole('error')).toHaveTextContent('');
    expect(screen.getByRole('data')).toHaveTextContent('{}');
    expect(successFn).not.toHaveBeenCalled();
    expect(completeFn).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('btnSend'));
    await waitFor(() => {
      expect(screen.getByRole('loading')).toHaveTextContent('loaded');
      expect(screen.getByRole('error')).toHaveTextContent('');
      expect(screen.getByRole('data')).toHaveTextContent(
        JSON.stringify({
          path: '/unit-test',
          method: 'GET',
          params: {}
        })
      );
      expect(successFn).toHaveBeenCalledTimes(1);
      expect(completeFn).toHaveBeenCalledTimes(1);
    });
  });

  test('should get the right value in computed value and set computed value', async () => {
    render(TestRequest as any, {
      props: {
        method: alovaInst.Get('/unit-test')
      }
    });

    expect(screen.getByRole('loadingComputed')).toHaveTextContent('loading');
    expect(screen.getByRole('dataComputed')).toHaveTextContent(JSON.stringify({}));
    await waitFor(() => {
      expect(screen.getByRole('loading')).toHaveTextContent('loaded');
      const resJson = JSON.stringify({
        path: '/unit-test',
        method: 'GET',
        params: {}
      });
      expect(screen.getByRole('data')).toHaveTextContent(resJson);
      expect(screen.getByRole('loadingComputed')).toHaveTextContent('loaded');
      expect(screen.getByRole('dataComputed')).toHaveTextContent(resJson);
    });

    fireEvent.click(screen.getByRole('btnModify'));
    await waitFor(() => {
      expect(screen.getByRole('dataComputed')).toHaveTextContent(
        JSON.stringify({
          modify: true
        })
      );
    });
  });

  test('watch the hook state', async () => {
    const watchFn = jest.fn();
    render(TestRequest as any, {
      props: {
        method: alovaInst.Get('/unit-test', {
          params: {
            e: 'ee'
          }
        })
      },
      ...eventObj({
        watchState(data: any) {
          watchFn(data);
        }
      })
    });

    await waitFor(() => {
      expect(watchFn).toHaveBeenCalledTimes(2);
      expect(watchFn).toHaveBeenCalledWith({
        path: '/unit-test',
        method: 'GET',
        params: { e: 'ee' }
      });
    });
  });

  test('request with managedStates', async () => {
    const Get = alovaInst.Get('/unit-test', {
      params: { aa: 'a' }
    });
    render(TestRequest as any, {
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
          params: { aa: 'a' }
        })
      );
      expect(screen.getByRole('extraData')).toHaveTextContent(''); // 暂时无法访问到managedStates中的数据
    });
  });

  test('useRequest with the same config object', async () => {
    const Get = alovaInst.Get('/unit-test', {
      params: { cc: 'c' }
    });
    render(RequestWithSameConfig as any, {
      props: {
        method: Get
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('loading1')).toHaveTextContent('loaded');
      expect(screen.getByRole('data1')).toHaveTextContent(
        JSON.stringify({
          path: '/unit-test',
          method: 'GET',
          params: { cc: 'c' }
        })
      );
      expect(screen.getByRole('loading2')).toHaveTextContent('loaded');
      expect(screen.getByRole('data2')).toHaveTextContent(
        JSON.stringify({
          path: '/unit-test',
          method: 'GET',
          params: { cc: 'c' }
        })
      );
    });
  });
});
