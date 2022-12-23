import { useRequest } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getAlovaInstance, mockServer } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('parallel request', function () {
  test('parallel request with `send` returned promise', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Getter = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    const firstState = useRequest(Getter, { immediate: false });
    const secondState = useRequest(Getter, { immediate: false });

    const [firstResponse, secondResponse] = await Promise.all([firstState.send(), secondState.send()]);

    expect(firstResponse.path).toBe('/unit-test');
    expect(firstState.data.value.path).toBe('/unit-test');
    expect(secondResponse.path).toBe('/unit-test');
    expect(secondState.data.value.path).toBe('/unit-test');
  });

  test('[request fail]parallel request with `send` returned promise', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Getter = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    const ErrorGetter = alova.Get('/unit-test-404', {
      transformData: ({ data }: Result) => data
    });
    const firstState = useRequest(Getter, { immediate: false });
    const secondState = useRequest(ErrorGetter, { immediate: false });

    const mockFn = jest.fn();
    Promise.all([firstState.send(), secondState.send()])
      .catch(mockFn)
      .then(() => {
        expect(mockFn).toBeCalledTimes(1);
      });
  });

  test('parallel request with `onSuccess` and `onError` hook', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Getter = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
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

    const [firstResponse, secondResponse] = await Promise.all([firstPromise, secondPromise]);
    expect(firstResponse.path).toBe('/unit-test');
    expect(firstState.data.value.path).toBe('/unit-test');
    expect(secondResponse.path).toBe('/unit-test');
    expect(secondState.data.value.path).toBe('/unit-test');
  });

  test('[request fail]parallel request with `onSuccess` and `onError` hook', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Getter = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    const ErrorGetter = alova.Get('/unit-test-404', {
      transformData: ({ data }: Result) => data
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
    Promise.all([firstPromise, secondPromise])
      .catch(mockFn)
      .then(() => {
        expect(mockFn).toBeCalledTimes(1);
      });
  });
});
