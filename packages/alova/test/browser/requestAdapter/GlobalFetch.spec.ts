import { getAlovaInstance } from '#/utils';
import { createAlova } from '@/index';
import adapterFetch from '@/predefine/adapterFetch';
import { Result } from 'root/testUtils';

describe('request adapter GlobalFetch', () => {
  test('the cache response data should be saved', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const mockFn = vi.fn();
    const Get = alova.Get('/unit-test', {
      cacheFor: 100 * 1000,
      transform: ({ data }: Result, headers) => {
        mockFn(data, headers);
        return data;
      }
    });
    await Get.send();
    expect(mockFn.mock.calls[0][0]).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {}
    });
    expect(mockFn.mock.calls[0][1].get('content-type')).toBe('application/json');
  });

  test('The Content-Type should be set to `application/json` default', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const method = alova.Post<Record<string, any>>('/unit-test-headers', {});
    const { data } = await method;
    expect(data.requestHeaders['content-type']).toBe('application/json; charset=UTF-8');
  });

  test('The Content-Type should be what you set when set the Content-Type', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    let method = alova.Post<Record<string, any>>(
      '/unit-test-headers',
      {},
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    let res = await method;
    expect(res.data.requestHeaders['content-type']).toBe('application/x-www-form-urlencoded');

    method = alova.Post<Record<string, any>>(
      '/unit-test-headers',
      {},
      {
        headers: {
          'Content-Type': 'abc'
        }
      }
    );
    res = await method;
    expect(res.data.requestHeaders['content-type']).toBe('abc');
  });

  test('The Content-Type should be undefined when pass the FormData', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    let method = alova.Post<Record<string, any>>('/unit-test-headers', new FormData());
    let res = await method;
    expect(res.data.requestHeaders['Content-Type']).toBeUndefined();

    method = alova.Post<Record<string, any>>('/unit-test-headers', new FormData(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    res = await method;
    expect(res.data.requestHeaders['content-type']).toBe('application/x-www-form-urlencoded');
  });

  test("shouldn't set `content-type` when value is falsy", async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });

    const res = await alova.Post<Result<{ requestHeaders: any }>>('/unit-test-headers', undefined, {
      headers: {
        'Content-Type': null
      }
    });
    expect(res.data.requestHeaders).toStrictEqual({});

    const res2 = await alova.Post<Result<{ requestHeaders: any }>>('/unit-test-headers', undefined, {
      headers: {
        'content-type': undefined
      }
    });
    expect(res2.data.requestHeaders).toStrictEqual({});

    const res3 = await alova.Post<Result<{ requestHeaders: any }>>('/unit-test-headers', undefined, {
      headers: {
        'Content-Type': ''
      }
    });
    expect(res3.data.requestHeaders).toStrictEqual({});

    const res4 = await alova.Post<Result<{ requestHeaders: any }>>('/unit-test-headers', undefined, {
      headers: {
        'Content-Type': false
      }
    });
    expect(res4.data.requestHeaders).toStrictEqual({});
  });

  test('should console error that the fetch api does not support uploading progress', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const method = alova.Get<Result>('/unit-test');
    method.onUpload(() => {});
    await method;
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "fetch API does'nt support uploading progress. please consider to change `@alova/adapter-xhr` or `@alova/adapter-axios`"
    );
    consoleError.mockRestore();
  });

  test('should use custom fetch when specify the `customFetch` option', async () => {
    const mockFn = vi.fn();
    const alova = createAlova({
      requestAdapter: adapterFetch({
        customFetch(...args) {
          mockFn();
          return fetch(...args);
        }
      }),
      responded: r => r.json()
    });
    const res = await alova.Get<Result>('/unit-test');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(res).toBeDefined();
  });
});
