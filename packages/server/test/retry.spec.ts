import { HookedMethod, retry } from '@/index';
import { createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';
import ReactHook from 'alova/react';

const alovaInst = createAlova({
  baseURL: 'http://localhost:8080',
  statesHook: ReactHook,
  requestAdapter: GlobalFetch(),
  responded: r => r.json()
});

describe('retry', () => {
  const requestFn = jest.fn();
  requestFn.mockImplementation(() => Promise.resolve(123));
  const method = new HookedMethod(
    alovaInst.Get('/unit-test', {
      cacheFor: 0
    }),
    requestFn
  );

  beforeEach(() => {
    requestFn.mockClear();
    jest.clearAllMocks();
  });

  test('should not retry when request is success', async () => {
    const retryMethod = retry(method, { retry: 3 });

    await expect(retryMethod.send(true)).resolves.toStrictEqual(123);
    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(requestFn).toHaveBeenLastCalledWith(true);
  });

  test('should retry 3 times by default', async () => {
    requestFn.mockImplementation(() => Promise.reject(new Error('request failed.')));
    const retryMethod = retry(method, { backoff: { delay: 1 } });

    const ret = retryMethod.send(true);
    await expect(ret).rejects.toBeInstanceOf(Error);
    await expect(ret).rejects.toHaveProperty('message', 'request failed.');

    expect(requestFn).toHaveBeenCalledTimes(1 + 3);
    expect(requestFn).toHaveBeenLastCalledWith(true);
  });

  test('should retry 1 times', async () => {
    requestFn.mockImplementation(() => Promise.reject(new Error('request failed.')));
    const retryMethod = retry(method, { backoff: { delay: 1 }, retry: 1 });

    const ret = retryMethod.send();
    await expect(ret).rejects.toBeInstanceOf(Error);
    await expect(ret).rejects.toHaveProperty('message', 'request failed.');

    expect(requestFn).toHaveBeenCalledTimes(1 + 1);
    expect(requestFn).toHaveBeenLastCalledWith(undefined);
  });

  test('should retry 2 times, the retry is a function', async () => {
    let counter = 0;
    requestFn.mockImplementation(() => Promise.reject(new Error('request failed.')));
    const retryMethod = retry(method, {
      backoff: { delay: 1 },
      retry: () => {
        counter += 1;
        return counter <= 2;
      }
    });

    const ret = retryMethod.send();
    await expect(ret).rejects.toBeInstanceOf(Error);
    await expect(ret).rejects.toHaveProperty('message', 'request failed.');

    expect(requestFn).toHaveBeenCalledTimes(1 + 2);
    expect(requestFn).toHaveBeenLastCalledWith(undefined);
  });

  test('should retry until response success', async () => {
    let counter = 0;
    requestFn.mockImplementation(() => {
      if (counter < 2) {
        counter += 1;
        return Promise.reject(new Error('request failed.'));
      }
      return Promise.resolve(123);
    });
    const retryMethod = retry(method, {
      backoff: { delay: 1 },
      retry: 5
    });

    const ret = retryMethod.send();
    await expect(ret).resolves.toBe(123);

    expect(requestFn).toHaveBeenCalledTimes(1 + 2);
  });

  test('custom delay and multiplier', async () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    let counter = 0;
    requestFn.mockImplementation(() => {
      if (counter < 2) {
        counter += 1;
        return Promise.reject(new Error('request failed.'));
      }
      return Promise.resolve(123);
    });

    const retryMethod = retry(method, {
      retry: 5,
      backoff: { delay: 10, multiplier: 2 }
    });

    const res = await retryMethod.send();
    const duration = setTimeoutSpy.mock.calls.reduce((acc, cur) => acc + (cur[1] || 0), 0);
    expect(requestFn).toHaveBeenCalledTimes(3);
    expect(duration).toBeGreaterThanOrEqual(30);
    expect(duration).toBeLessThanOrEqual(35);
    expect(res).toBe(123);
  });

  test('only startQuiver', async () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    let counter = 0;
    requestFn.mockImplementation(() => {
      if (counter < 1) {
        counter += 1;
        return Promise.reject(new Error('request failed.'));
      }
      return Promise.resolve(123);
    });

    const retryMethod = retry(method, {
      retry: 5,
      backoff: { delay: 10, multiplier: 1, startQuiver: 0.5 }
    });

    const res = await retryMethod.send();
    const duration = setTimeoutSpy.mock.calls[0][1];
    expect(requestFn).toHaveBeenCalledTimes(2);
    expect(duration).toBeGreaterThanOrEqual(15); // 10ms + 50% quiver
    expect(duration).toBeLessThanOrEqual(20); // 10ms + 100% quiver
    expect(res).toBe(123);
  });

  test('only endQuiver', async () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    let counter = 0;
    requestFn.mockImplementation(() => {
      if (counter < 1) {
        counter += 1;
        return Promise.reject(new Error('request failed.'));
      }
      return Promise.resolve(123);
    });

    const retryMethod = retry(method, {
      retry: 5,
      backoff: { delay: 10, multiplier: 1, endQuiver: 0.5 }
    });

    const res = await retryMethod.send();
    const duration = setTimeoutSpy.mock.calls[0][1];
    expect(requestFn).toHaveBeenCalledTimes(2);
    expect(duration).toBeGreaterThanOrEqual(10); // 10ms + 0% quiver
    expect(duration).toBeLessThanOrEqual(15); // 10ms + 50% quiver
    expect(res).toBe(123);
  });

  test('startQuiver and endQuiver', async () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    let counter = 0;
    requestFn.mockImplementation(() => {
      if (counter < 1) {
        counter += 1;
        return Promise.reject(new Error('request failed.'));
      }
      return Promise.resolve(123);
    });

    const retryMethod = retry(method, {
      retry: 5,
      backoff: { delay: 10, multiplier: 1, startQuiver: 0.5, endQuiver: 0.8 }
    });

    const res = await retryMethod.send();
    const duration = setTimeoutSpy.mock.calls[0][1];
    expect(requestFn).toHaveBeenCalledTimes(2);
    expect(duration).toBeGreaterThanOrEqual(15); // 10ms + 50% quiver
    expect(duration).toBeLessThanOrEqual(18); // 10ms + 80% quiver
    expect(res).toBe(123);
  });
});
