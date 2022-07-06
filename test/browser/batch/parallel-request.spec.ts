import {
  createAlova,
  useRequest,
  GlobalFetch,
  all,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { RequestConfig } from '../../../typings';
import { Result } from '../result.type';
import server from '../../server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
function getInstance(
  beforeRequestExpect?: (config: RequestConfig<any, any>) => void,
  responseExpect?: (jsonPromise: Promise<any>) => void,
  resErrorExpect?: (err: Error) => void,
) {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 3000,
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    beforeRequest(config) {
      beforeRequestExpect && beforeRequestExpect(config);
      return config;
    },
    responsed: {
      success: response => {
        const jsonPromise = response.json();
        responseExpect && responseExpect(jsonPromise);
        return jsonPromise;
      },
      error: err => {
        resErrorExpect && resErrorExpect(err);
      }
    }
  });
}


describe('ParallelRequest', () => {
  test('parallel request with `all` function', done => {
    const alova = getInstance();
    const Get = alova.Get<Result>('/unit-test');
    const Post = alova.Post<Result<number>>('/unit-test');
    const Put = alova.Put<Result<number>>('/unit-test');
    const firstState = useRequest(Get);
    const secondState = useRequest(Post);
    const thirdState = useRequest(Put);

    const mockCompleteFn = jest.fn(() => {});
    let count = 0;
    all([
      firstState.responser,
      secondState.responser,
      thirdState.responser
    ]).success(arr => {
      const [first, second, third] = arr;
      expect(arr.length).toBe(3);
      expect(first.data.path).toBe('/unit-test');
      expect(first.data.method).toBe('GET');
      expect(second.data.path).toBe('/unit-test');
      expect(second.data.method).toBe('POST');
      expect(third.data.path).toBe('/unit-test');
      expect(third.data.method).toBe('PUT');
      expect(mockCompleteFn.mock.calls.length).toBe(count);
      count > 0 && done();
      count++;
    }).complete(mockCompleteFn);

    // 即使不需要同步发起请求，只要三个请求有响应即可触发一次success
    setTimeout(() => {
      firstState.send();
      thirdState.send();
      setTimeout(secondState.send, 500);
    }, 1000);
  });

  test('parallel request with `all` function but one of them throws error', done => {
    const alova = getInstance();
    const Get = alova.Get<Result>('/unit-test-404');
    const Post = alova.Post<Result<number>>('/unit-test');
    const Put = alova.Put<Result<number>>('/unit-test');
    const firstState = useRequest(Put);
    const secondState = useRequest(Post);
    const thirdState = useRequest(Get);

    const mockCompleteFn = jest.fn(() => {});
    const mockSuccessFn = jest.fn(() => {});
    let count = 0;
    all([
      firstState.responser,
      secondState.responser,
      thirdState.responser
    ]).error(err => {
      expect(err).toBeInstanceOf(Error);
      expect(mockCompleteFn.mock.calls.length).toBe(count);
      expect(mockSuccessFn.mock.calls.length).toBe(0);    // 请求错误，不会触发success
      count > 0 && done();
      count++;
    }).success(mockSuccessFn).complete(mockCompleteFn);

    // 即使不需要同步发起请求，只要三个请求有响应即可触发一次success
    setTimeout(() => {
      firstState.send().catch(() => {});
      thirdState.send().catch(() => {});
      setTimeout(secondState.send, 500);
    }, 1000);
  });
});