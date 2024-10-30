import defaultCacheLogger from '@/defaults/cacheLogger';
import { createAlova } from '@/index';
import GlobalFetch from '@/predefine/adapterFetch';

const baseURL = process.env.NODE_BASE_URL as string;
describe('createAlova', () => {
  test('should be an error prompt indicating the setting of l2cache when accessing l2cache on the server', () => {
    const alova = createAlova({
      baseURL,
      requestAdapter: GlobalFetch()
    });

    const errorTips = 'l2Cache is not defined.';
    expect(() => {
      alova.l2Cache.get('1');
    }).toThrow(errorTips);
    expect(() => {
      alova.l2Cache.set('1', '112');
    }).toThrow(errorTips);
    expect(() => {
      alova.l2Cache.remove('1');
    }).toThrow(errorTips);
    expect(() => {
      alova.l2Cache.clear();
    }).toThrow(errorTips);
  });

  test('cache logger in server', async () => {
    const logConsoleMockFn = vi.fn();
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
