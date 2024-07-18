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
  const method = new HookedMethod(alovaInst.Get('/unit-test'), requestFn);

  beforeEach(() => {
    requestFn.mockClear();
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
});
