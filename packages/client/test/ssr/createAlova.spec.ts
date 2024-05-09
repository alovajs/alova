import defaultCacheLogger from '@/defaults/cacheLogger';
import { createAlova, updateState, useRequest } from '@/index';
import GlobalFetch from '@/predefine/adapterFetch';

const baseURL = process.env.NODE_BASE_URL as string;
describe('createAlova', () => {
  test('should throw error in useHooks when statesHook is not specific', async () => {
    const alova = createAlova({
      requestAdapter: GlobalFetch()
    });
    const methodInst = alova.Get('http://localhost:3000/unit-test', {
      transformData: (response: Response) => response.json()
    });
    const result = await methodInst;
    expect(result).toStrictEqual({
      code: 200,
      msg: '',
      data: {
        path: '/unit-test',
        method: 'GET',
        params: {}
      }
    });

    expect(() => {
      useRequest(methodInst);
    }).toThrow('[alova]can not call useHooks until set the `statesHook` at alova instance');

    expect(() => {
      updateState(methodInst, {});
    }).toThrow('[alova]can not call updateState until set the `statesHook` at alova instance');
  });

  test('cache logger in server', async () => {
    const logConsoleMockFn = jest.fn();
    // eslint-disable-next-line
    console.log = logConsoleMockFn; // 重写以便监听
    const alova = createAlova({
      baseURL,
      requestAdapter: GlobalFetch()
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      name: 'get-method'
    });
    const response = await Get1;
    defaultCacheLogger(response, Get1, 'memory', undefined);
    expect(logConsoleMockFn).toHaveBeenCalledTimes(4);
    const calls1 = logConsoleMockFn.mock.calls.slice(0);
    const startSep = ` [HitCache]${Get1.url} `;
    expect(calls1[0][1]).toBe(startSep);
    expect(calls1[1][1]).toBe(' Cache ');
    expect(calls1[1][2]).toStrictEqual(response);
    expect(calls1[2][1]).toBe(' Mode  ');
    expect(calls1[2][2]).toStrictEqual('memory');
    expect(calls1[3][1]).toBe(Array(startSep.length + 1).join('^'));

    defaultCacheLogger(response, Get1, 'restore', 'v1');
    expect(logConsoleMockFn).toHaveBeenCalledTimes(9);
    const calls2 = logConsoleMockFn.mock.calls.slice(4);
    expect(calls2[0][1]).toBe(startSep);
    expect(calls2[1][1]).toBe(' Cache ');
    expect(calls2[1][2]).toStrictEqual(response);
    expect(calls2[2][1]).toBe(' Mode  ');
    expect(calls2[2][2]).toStrictEqual('restore');
    expect(calls2[3][1]).toBe(' Tag   ');
    expect(calls2[3][2]).toStrictEqual('v1');
    expect(calls2[4][1]).toBe(Array(startSep.length + 1).join('^'));
  });

  test('log with restore mode', async () => {
    const alova = createAlova({
      baseURL,
      requestAdapter: GlobalFetch()
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      name: 'get-method'
    });
    const response = await Get1;

    defaultCacheLogger(response, Get1, 'restore', 'v1');
  });
});
