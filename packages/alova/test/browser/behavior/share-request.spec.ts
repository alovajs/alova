import { getAlovaInstance } from '#/utils';
import { createAlova } from '@/index';
import { Result, delay, untilReject } from 'root/testUtils';

describe('Request shared', () => {
  test('should share request when use usehooks', async () => {
    const requestMockFn = jest.fn();
    const beforeRequestMockFn = jest.fn();
    const responseMockFn = jest.fn();
    const alova = createAlova({
      baseURL: 'http://xxx',
      cacheFor: {
        GET: 0
      },
      beforeRequest() {
        beforeRequestMockFn();
      },
      responded(data) {
        responseMockFn();
        return data;
      },
      requestAdapter() {
        requestMockFn();
        return {
          response: async () => {
            await delay(5);
            return {
              status: 200,
              data: { id: 1 }
            };
          },
          headers: async () => ({}),
          abort() {}
        };
      }
    });

    const Get = () => alova.Get<{ status: number; data: { id: number } }>('/unit-test');
    const p1 = Get().send();
    const p2 = Get().send();

    const [data1, data2] = await Promise.all([p1, p2]);
    expect(data1.status).toBe(200);
    expect(data1.data).toStrictEqual({ id: 1 });
    expect(data2.status).toBe(200);
    expect(data2.data).toStrictEqual({ id: 1 });

    // Because the request is shared, it is only executed once
    expect(requestMockFn).toHaveBeenCalledTimes(1);

    // The number of global request hook calls remains unchanged
    expect(beforeRequestMockFn).toHaveBeenCalledTimes(2);
    expect(responseMockFn).toHaveBeenCalledTimes(2);
  });

  test('request shared promise will also remove when request error', async () => {
    let index = 0;
    const alova = createAlova({
      baseURL: 'http://xxx',
      cacheFor: {
        GET: 0
      },
      requestAdapter() {
        const promise = new Promise((resolve, reject) => {
          if (index === 0) {
            index += 1;
            reject(new Error('request error'));
          } else {
            resolve({
              id: 1
            });
          }
        });
        return {
          response: () => promise,
          headers: async () => ({}),
          abort() {}
        };
      }
    });

    const Get = alova.Get('/unit-test');

    // An error will be thrown for the first request, but not for the second time.
    await expect(Get.send()).rejects.toThrow('request error');
    const res = await Get.send();
    expect(res).toStrictEqual({ id: 1 });
  });

  test('request shared promise will also remove when throw in response handler', async () => {
    let i = 0;
    const alova = getAlovaInstance({
      cacheFor: {
        GET: 0
      },
      responseExpect(response) {
        if (i === 0) {
          i += 1;
          throw new Error('custom error');
        }
        return response.json();
      }
    });

    const Get = alova.Get('/unit-test-count', {
      params: {
        countKey: 'bb'
      },
      transformData: ({ data }: Result) => data
    });

    // An error will be thrown for the first request, but not for the second time.
    await expect(Get.send()).rejects.toThrow('custom error');
    const res = await Get;

    // count=1 indicates that the service has been requested again
    expect(res).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: {
        countKey: 'bb',
        count: 1
      }
    });
  });

  test('request shared promise will also remove when throw in async response handler', async () => {
    let i = 0;
    const alova = getAlovaInstance({
      cacheFor: {
        GET: 0
      },
      async responseExpect(response) {
        if (i === 0) {
          i += 1;
          throw new Error('custom error');
        }
        return response.json();
      }
    });

    const Get = alova.Get('/unit-test-count', {
      params: {
        countKey: 'cc'
      },
      transformData: ({ data }: Result) => data
    });

    // An error will be thrown for the first request, but not for the second time.
    await expect(Get.send()).rejects.toThrow('custom error');
    const res = await Get.send();

    // count=1 indicates that the service has been requested again
    expect(res).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: {
        countKey: 'cc',
        count: 1
      }
    });
  });

  test('request shared promise will be removed when abort request manually', async () => {
    const alova = getAlovaInstance({
      cacheFor: {
        GET: 0
      }
    });
    const Get = alova.Get('/unit-test');
    const prom = Get.send();

    // Manually interrupt the request and an error will be thrown
    await delay(0);
    Get.abort();

    const error = await untilReject(prom);
    expect(error.message).toBe('The operation was aborted.');

    // Send the request again, it should be successful now
    expect(await Get).not.toBeUndefined();
  });

  test("shouldn't share request when close in global config", async () => {
    const requestMockFn = jest.fn();
    const alova = createAlova({
      baseURL: 'http://xxx',
      cacheFor: {
        GET: 0
      },
      shareRequest: false,
      requestAdapter() {
        requestMockFn();
        return {
          response: async () => ({
            status: 200,
            data: { id: 1 }
          }),
          headers: async () => ({}),
          abort() {}
        };
      }
    });

    const Get = () =>
      alova.Get('/unit-test', {
        transformData: (data: { status: number; data: { id: number } }) => data.status
      });

    const [rawData1, rawData2] = await Promise.all([Get().send(), Get().send()]);
    expect(rawData1).toBe(200);
    expect(rawData2).toBe(200);

    // Request sharing is closed and executed twice
    expect(requestMockFn).toHaveBeenCalledTimes(2);
  });

  test("shouldn't share request when close in method config", async () => {
    const requestMockFn = jest.fn();
    const alova = createAlova({
      baseURL: 'http://xxx',
      cacheFor: {
        GET: 0
      },
      requestAdapter() {
        requestMockFn();
        return {
          response: async () => ({
            status: 200,
            data: { id: 1 }
          }),
          headers: async () => ({}),
          abort() {}
        };
      }
    });

    const Get = () =>
      alova.Get('/unit-test', {
        shareRequest: false,
        transformData: (data: { status: number; data: { id: number } }) => data.status
      });

    const [rawData1, rawData2] = await Promise.all([Get().send(), Get().send()]);
    expect(rawData1).toBe(200);
    expect(rawData2).toBe(200);

    // The sharing request is closed in the method configuration and executed twice
    expect(requestMockFn).toHaveBeenCalledTimes(2);
  });
});
