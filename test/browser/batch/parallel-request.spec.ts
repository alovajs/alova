import {
  createAlova,
  useRequest
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import GlobalFetch from '../../../src/predefine/GlobalFetch';
import server from '../../server';
import { AlovaRequestAdapterConfig } from '../../../typings';
import { Result } from '../result.type';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
function getInstance(
  beforeRequestExpect?: (config: AlovaRequestAdapterConfig<any, any, RequestInit, Headers>) => void,
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
      onSuccess: response => {
        const jsonPromise = response.json();
        responseExpect && responseExpect(jsonPromise);
        return jsonPromise;
      },
      onError: err => {
        resErrorExpect && resErrorExpect(err);
      }
    }
  });
}

describe('parallel request', function() {
  test('parallel request with `send` returned promise', async () => {
    const alova = getInstance();
    const Getter = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
    });
    const firstState = useRequest(Getter, { immediate: false });
    const secondState = useRequest(Getter, { immediate: false });

    const [
      firstResponse,
      secondResponse,
    ] = await Promise.all([
      firstState.send(),
      secondState.send()
    ]);

    expect(firstResponse.path).toBe('/unit-test');
    expect(firstState.data.value.path).toBe('/unit-test');
    expect(secondResponse.path).toBe('/unit-test');
    expect(secondState.data.value.path).toBe('/unit-test');
  });


  test('[request fail]parallel request with `send` returned promise', async () => {
    const alova = getInstance();
    const Getter = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
    });
    const ErrorGetter = alova.Get('/unit-test-404', {
      transformData: ({ data }: Result) => data,
    });
    const firstState = useRequest(Getter, { immediate: false });
    const secondState = useRequest(ErrorGetter, { immediate: false });

    const mockFn = jest.fn();
    Promise.all([
      firstState.send(),
      secondState.send()
    ]).catch(mockFn).then(() => {
      expect(mockFn).toBeCalledTimes(1);
    });
  });


  test('parallel request with `onSuccess` and `onError` hook', async () => {
    const alova = getInstance();
    const Getter = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
    });
    const firstState = useRequest(Getter);
    const secondState = useRequest(Getter);

    const firstPromise = new Promise<Result['data']>((resolve, reject) => {
      firstState.onSuccess(resolve);
      firstState.onError(reject);
    });
    const secondPromise = new Promise<Result['data']>((resolve, reject) => {
      secondState.onSuccess(resolve);
      secondState.onError(reject);
    });

    const [
      firstResponse,
      secondResponse,
    ] = await Promise.all([
      firstPromise,
      secondPromise
    ]);
    expect(firstResponse.path).toBe('/unit-test');
    expect(firstState.data.value.path).toBe('/unit-test');
    expect(secondResponse.path).toBe('/unit-test');
    expect(secondState.data.value.path).toBe('/unit-test');
  });


  test('[request fail]parallel request with `onSuccess` and `onError` hook', async () => {
    const alova = getInstance();
    const Getter = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
    });
    const ErrorGetter = alova.Get('/unit-test-404', {
      transformData: ({ data }: Result) => data,
    });
    const firstState = useRequest(Getter);
    const secondState = useRequest(ErrorGetter);

    const firstPromise = new Promise<Result['data']>((resolve, reject) => {
      firstState.onSuccess(resolve);
      firstState.onError(reject);
    });
    const secondPromise = new Promise<Result['data']>((resolve, reject) => {
      secondState.onSuccess(resolve);
      secondState.onError(reject);
    });

    const mockFn = jest.fn();
    Promise.all([
      firstPromise,
      secondPromise
    ]).catch(mockFn).then(() => {
      expect(mockFn).toBeCalledTimes(1);
    });
  });
});