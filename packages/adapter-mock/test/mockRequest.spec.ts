import { createAlovaMockAdapter, defineMock } from '@/index';
import { createAlova } from 'alova';
import { delay, untilCbCalled, untilReject } from 'root/testUtils';

declare const isSSR: boolean;
describe('mock request', () => {
  test('response with plain body data', async () => {
    const mockApi = vi.fn();
    const mocks = defineMock({
      '[POST]/detail': ({ query, params, data, headers }) => {
        mockApi();
        expect(query).toStrictEqual({ a: '1', b: '2', c: '3' });
        expect(params).toStrictEqual({});
        expect(data).toStrictEqual({ p1: 'p1', p2: 'p2' });
        expect(headers).toStrictEqual({ h1: 'h1' });
        return {
          id: 1
        };
      }
    });

    // Mock Data Request Adapter
    const mockResponse = vi.fn();
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      onMockResponse: ({ status, statusText, body }, { params, query, data, headers }) => {
        mockResponse();
        expect(status).toBe(200);
        expect(statusText).toBe('ok');
        expect(body).toStrictEqual({ id: 1 });
        expect(query).toStrictEqual({ a: '1', b: '2', c: '3' });
        expect(params).toStrictEqual({});
        expect(data).toStrictEqual({ p1: 'p1', p2: 'p2' });
        expect(headers).toStrictEqual({ h1: 'h1' });

        if (status >= 300) {
          const err = new Error(statusText);
          err.name = status.toString();
          throw err;
        }
        return {
          response: body,
          headers: {}
        };
      },
      mockRequestLogger: false
    });

    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });
    const payload = await alovaInst
      .Post(
        '/detail?a=1&b=2',
        { p1: 'p1', p2: 'p2' },
        {
          params: {
            c: 3
          },
          headers: {
            h1: 'h1'
          }
        }
      )
      .send();
    expect(payload).toStrictEqual({ id: 1 });
    expect(mockApi).toHaveBeenCalled();
    expect(mockResponse).toHaveBeenCalled();
  });

  test('should call `mockRequestLogger` and receive all request data', async () => {
    const mocks = defineMock({
      '[POST]/detail': () => ({
        id: 1
      }),
      '[POST]/detail2': null
    });

    const mockFn = vi.fn();
    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      onMockResponse: (responseData, _, method) => {
        if (method.url === '/detail2') {
          throw new Error('response error');
        }
        return {
          response: responseData.body,
          headers: {}
        };
      },
      mockRequestLogger: logger => {
        mockFn(logger);
      }
    });

    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });
    const payload = await alovaInst.Post(
      '/detail?aa=1&bb=2',
      {},
      {
        headers: {
          customHeader: 1
        }
      }
    );
    expect(payload).toStrictEqual({ id: 1 });
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith({
      isMock: true,
      url: 'http://xxx/detail?aa=1&bb=2',
      method: 'POST',
      headers: {
        customHeader: 1
      },
      params: {},
      query: {
        aa: '1',
        bb: '2'
      },
      data: {},
      responseHeaders: {},
      response: {
        id: 1
      }
    });

    await expect(alovaInst.Post('/detail2').send()).rejects.toThrow('response error');
    expect(mockFn).toHaveBeenCalledTimes(1); // mockRequestLogger will not be called when throw error in `onMockResponse`
  });

  test('response with status and statusText', async () => {
    const mocks = defineMock({
      '[POST]/detail': () => ({
        status: 403,
        statusText: 'customer error',
        responseHeaders: {
          rh1: 'rh1'
        }
      })
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      mockRequestLogger: false,
      onMockResponse: ({ status, statusText, responseHeaders, body }) => {
        expect(responseHeaders).toStrictEqual({ rh1: 'rh1' });
        if (status >= 300) {
          const err = new Error(statusText);
          err.name = status.toString();
          throw err;
        }
        return body;
      }
    });

    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });

    const mockFn = vi.fn();
    try {
      await alovaInst.Post('/detail').send();
    } catch (err: any) {
      mockFn();
      expect(err.name).toBe('403');
      expect(err.message).toBe('customer error');
    }
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should return null when return `null` in mock', async () => {
    const mocks = defineMock({
      '[POST]/detail': () => null
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      mockRequestLogger: false,
      onMockResponse({ body }) {
        return {
          response: body,
          headers: {}
        };
      }
    });
    const alova = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });
    const data = await alova.Post('/detail');
    expect(data).toBeNull();
  });

  test('should throw error of 404 when return `undefined` in mock', async () => {
    const mocks = defineMock({
      '[POST]/detail': () => undefined
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      mockRequestLogger: false
    });
    const alova = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });
    const response = await alova.Post<Response>('/detail');
    expect(response.status).toBe(404);
    expect(response.statusText).toBe('api not found');

    // access api that not exists
    expect(alova.Post<Response>('/detail234')).rejects.toThrow('cannot find the httpAdapter');
  });

  test('should receive error when throw it in mock function', async () => {
    const mocks = defineMock({
      '[POST]/detail': () => {
        throw new Error('network error');
      }
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      mockRequestLogger: false,
      onMockResponse: ({ status, statusText, body }) => {
        if (status >= 300) {
          const err = new Error(statusText);
          err.name = status.toString();
          throw err;
        }
        return {
          response: body,
          headers: {}
        };
      },
      onMockError: error => new Error(`new error:${error.message}`)
    });

    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });

    await expect(() => alovaInst.Post('/detail').send()).rejects.toThrow('new error:network error');
  });

  test('should work when mock function is async', async () => {
    const mocks = defineMock({
      '[POST]/detail': async () => ({
        id: 1
      })
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      onMockResponse: ({ body }) => ({
        response: body,
        headers: {}
      }),
      mockRequestLogger: false
    });

    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });

    const res = await alovaInst.Post('/detail').send();
    expect(res).toStrictEqual({ id: 1 });
  });

  test('should receive error when throw it in async mock function', async () => {
    const mocks = defineMock({
      '[POST]/detail': async () => {
        throw new Error('network error');
      }
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      mockRequestLogger: false,
      onMockResponse: ({ status, statusText, body }) => {
        if (status >= 300) {
          const err = new Error(statusText);
          err.name = status.toString();
          throw err;
        }
        return {
          response: body,
          headers: {}
        };
      },
      onMockError: error => new Error(`new error:${error.message}`)
    });

    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });

    await expect(() => alovaInst.Post('/detail').send()).rejects.toThrow('new error:network error');
  });

  test.skipIf(isSSR)("shouldn't throw error when has no being request", async () => {
    const mocks = defineMock({
      '[POST]/detail': async () => []
    });
    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      mockRequestLogger: false,
      onMockResponse: ({ body }) => ({
        response: body,
        headers: {}
      })
    });

    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });

    const Post = alovaInst.Post('/detail');
    delay(0).then(() => {
      Post.abort();
    });

    await expect(Post).rejects.toThrow('The user abort request');
  });

  test.skipIf(isSSR)('should abort request when call abort manually', async () => {
    const mocks = defineMock({
      '[POST]/detail': async () => []
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 1000,
      mockRequestLogger: false
    });

    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });

    const fn = vi.fn();
    const Post = alovaInst.Post('/detail');
    Post.send().catch(err => {
      fn(err);
    });
    await untilCbCalled(setTimeout, 500);
    Post.abort();
    await untilCbCalled(setTimeout, 100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0].message).toBe('The user abort request');
  });

  test.skipIf(isSSR)('should abort request even if delay in mock function', async () => {
    const mocks = defineMock({
      '[POST]/detail': async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 1000);
        });
        return [];
      }
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      mockRequestLogger: false
    });

    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      requestAdapter: mockRequestAdapter
    });
    const fn = vi.fn();
    const Post = alovaInst.Post('/detail');
    Post.send().catch(err => {
      fn(err);
    });
    await untilCbCalled(setTimeout, 500);
    Post.abort();
    await untilCbCalled(setTimeout, 100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0].message).toBe('The user abort request');
  });

  test.skipIf(isSSR)('should throw timeout error when timeout', async () => {
    const mocks = defineMock({
      '[POST]/detail': async () => []
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 1000,
      mockRequestLogger: false
    });

    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      timeout: 500,
      requestAdapter: mockRequestAdapter
    });

    const error = await untilReject(alovaInst.Post('/detail'));
    expect(error.message).toBe('request timeout');
  });

  test.skipIf(isSSR)('should timeout even if delay in mock function', async () => {
    const mocks = defineMock({
      '[POST]/detail': async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 1000);
        });
        return [];
      }
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      mockRequestLogger: false
    });
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      timeout: 500,
      requestAdapter: mockRequestAdapter
    });

    const error = await untilReject(alovaInst.Post('/detail'));
    expect(error.message).toBe('request timeout');
  });

  test('should match method url in `methodurl` mode', async () => {
    const mocks = defineMock({
      '[POST]/detail': {
        id: 1
      }
    });

    // Mock Data Request Adapter
    const mockRequestAdapter = createAlovaMockAdapter([mocks], {
      delay: 10,
      mockRequestLogger: false,
      matchMode: 'methodurl',
      onMockResponse({ body }) {
        return {
          response: body,
          headers: {}
        };
      }
    });

    const data = await createAlova({
      baseURL: 'http://xxx/v1/v2',
      timeout: 500,
      requestAdapter: mockRequestAdapter
    })
      .Post('/detail')
      .send();
    expect(data).toStrictEqual({ id: 1 });
  });
});
