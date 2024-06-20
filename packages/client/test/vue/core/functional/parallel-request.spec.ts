import { getAlovaInstance } from '#/utils';
import useRequest from '@/hooks/core/useRequest';
import VueHook from '@/statesHook/vue';
import { Result } from 'root/testUtils';
import { AlovaSuccessEvent } from '~/typings';

describe('parallel request', () => {
  test('parallel request with `send` returned promise', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Getter = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    const { data: data1, send: send1 } = useRequest(Getter, { immediate: false });
    const { data: data2, send: send2 } = useRequest(Getter, { immediate: false });
    const [firstResponse, secondResponse] = await Promise.all([send1(), send2()]);

    expect(firstResponse.path).toBe('/unit-test');
    expect(data1.value.path).toBe('/unit-test');
    expect(secondResponse.path).toBe('/unit-test');
    expect(data2.value.path).toBe('/unit-test');
  });

  test('[request fail]parallel request with `send` returned promise', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Getter = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    const ErrorGetter = alova.Get('/unit-test-404', {
      transform: ({ data }: Result) => data
    });
    const firstState = useRequest(Getter, { immediate: false });
    const secondState = useRequest(ErrorGetter, { immediate: false });

    const mockFn = jest.fn();
    Promise.all([firstState.send(), secondState.send()])
      .catch(mockFn)
      .then(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
      });
  });

  test('parallel request with `onSuccess` and `onError` hook', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Getter = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    const firstState = useRequest(Getter);
    const secondState = useRequest(Getter);

    const data1 = firstState.data;
    const data2 = secondState.data;

    const firstPromise = new Promise<AlovaSuccessEvent<any>>((resolve, reject) => {
      firstState.onSuccess(resolve);
      firstState.onError(reject);
    });
    const secondPromise = new Promise<AlovaSuccessEvent<any>>((resolve, reject) => {
      secondState.onSuccess(resolve);
      secondState.onError(reject);
    });

    const [firstEvent, secondEvent] = await Promise.all([firstPromise, secondPromise]);
    expect(firstEvent.method).toBe(Getter);
    expect(firstEvent.sendArgs).toStrictEqual([]);

    const firstResponse = firstEvent.data;
    const secondResponse = secondEvent.data;
    expect(firstResponse.path).toBe('/unit-test');
    expect(data1.value.path).toBe('/unit-test');
    expect(secondResponse.path).toBe('/unit-test');
    expect(data2.value.path).toBe('/unit-test');
  });

  test('[request fail]parallel request with `onSuccess` and `onError` hook', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Getter = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    const ErrorGetter = alova.Get('/unit-test-404', {
      transform: ({ data }: Result) => data
    });
    const firstState = useRequest(Getter);
    const secondState = useRequest(ErrorGetter);

    const firstPromise = new Promise<AlovaSuccessEvent<any>>((resolve, reject) => {
      firstState.onSuccess(resolve);
      firstState.onError(reject);
    });
    const secondPromise = new Promise<AlovaSuccessEvent<any>>((resolve, reject) => {
      secondState.onSuccess(resolve);
      secondState.onError(reject);
    });

    const mockFn = jest.fn();
    Promise.all([firstPromise, secondPromise])
      .catch(mockFn)
      .then(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
      });
  });
});
