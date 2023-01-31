import { createAlova, useRequest } from '../../../src';
import GlobalFetch from '../../../src/predefine/GlobalFetch';
import VueHook from '../../../src/predefine/VueHook';
import { removeResponseCache } from '../../../src/storage/responseCache';
import { buildNamespacedStorageKey, getPersistentResponse } from '../../../src/storage/responseStorage';
import { key } from '../../../src/utils/helper';
import { DetailLocalCacheConfig } from '../../../typings';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('persist data', function () {
  test('should persist responsed data but it still send request when request again', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test-count', {
      params: { countKey: 'g' },
      localCache: {
        expire: 500,
        mode: 'placeholder'
      },
      transformData: ({ data }: Result) => data
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);

    // 持久化数据里有值
    const persisitentResponse = getPersistentResponse(alova.id, Get, alova.storage);
    expect(persisitentResponse).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'g' }
    });

    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));
    const secondState = useRequest(Get);
    expect(secondState.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'g' }
    }); // 因为有持久化数据，因此直接带出了持久化的数据
    expect(secondState.loading.value).toBeTruthy(); // 即使有持久化数据，loading的状态也照样会是true

    await untilCbCalled(setTimeout, 600);
    const thirdState = useRequest(Get);
    expect(thirdState.data.value).toBeUndefined(); // 持久化数据过期，所以data没有值
  });

  test("persistent data wouldn't be invalid when set persistTime to `Infinity`", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: {
        expire: Infinity,
        mode: 'placeholder'
      },
      transformData: ({ data }: Result) => data
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);

    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));
    const secondState = useRequest(Get);
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} }); // 因为有持久化数据，因此直接带出了持久化的数据
    expect(secondState.loading.value).toBeTruthy(); // 即使有持久化数据，loading的状态也照样会是true

    await untilCbCalled(setTimeout, 1000);
    const thirdState = useRequest(Get);
    expect(thirdState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} }); // 持久化数据用不过期
  });

  test('persistent data will restore even if the cache of the same key is invalid', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: {
        expire: 100 * 1000,
        mode: 'restore',
        tag: 'v1'
      },
      transformData: ({ data }: Result) => data
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);

    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));
    const secondState = useRequest(Get);

    // 设置为restore后，即使本地缓存失效了，也会自动将持久化数据恢复到缓存在宏，因此会命中缓存
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState.loading.value).toBeFalsy();
  });

  test('expire param can also be set a Date instance', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const expireDate = new Date();
    expireDate.setHours(23, 59, 59, 999);
    const Get = alova.Get('/unit-test', {
      localCache: {
        expire: expireDate,
        mode: 'restore',
        tag: 'v1'
      },
      transformData: ({ data }: Result) => data
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);

    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));
    const secondState = useRequest(Get);

    // 设置为restore后，即使本地缓存失效了，也会自动将持久化数据恢复到缓存在宏，因此会命中缓存
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState.loading.value).toBeFalsy();
  });

  test('persistent data will invalid when param `tag` of alova instance is changed', async () => {
    const alova = getAlovaInstance(VueHook, {
      localCache: {
        GET: {
          expire: 100 * 1000,
          mode: 'restore'
        }
      },
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);

    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));
    (alova.options.localCache?.GET as DetailLocalCacheConfig).tag = 'v3'; // 修改tag
    const Get2 = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    const secondState = useRequest(Get2);

    // alova实例的tag改变后，持久化数据会失效，因此会重新发起请求，并且data的值会变成undefined
    expect(secondState.loading.value).toBeTruthy();
    expect(secondState.data.value).toBeUndefined();

    await untilCbCalled(secondState.onSuccess);
    expect(secondState.loading.value).toBeFalsy();
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
  });

  test('persistent data will invalid when `methodInstance` param `tag` is changed', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: {
        expire: 100 * 1000,
        mode: 'restore'
      },
      transformData: ({ data }: Result) => data
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);

    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));
    const Get2 = alova.Get('/unit-test', {
      localCache: {
        expire: 100 * 1000,
        mode: 'restore',
        tag: 'v2'
      },
      transformData: ({ data }: Result) => data
    });
    const secondState = useRequest(Get2);

    // tag改变后，持久化数据会失效，因此会重新发起请求，并且data的值会变成undefined
    expect(secondState.loading.value).toBeTruthy();
    expect(secondState.data.value).toBeUndefined();

    await untilCbCalled(secondState.onSuccess);
    expect(secondState.loading.value).toBeFalsy();
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
  });

  test('should change set and get behavior when custom storage in method instance creating', async () => {
    const mockStorage = {} as Record<string, any>;
    const alova = createAlova({
      baseURL: 'http://localhost:3000',
      timeout: 3000,
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      responsed: r => r.json(),
      storageAdapter: {
        set(key, value) {
          mockStorage[key] = value;
        },
        get(key) {
          return mockStorage[key];
        },
        remove(key) {
          delete mockStorage[key];
        }
      }
    });
    const Get = alova.Get('/unit-test', {
      localCache: {
        expire: 5000,
        mode: 'placeholder'
      },
      storage: {
        get(storageConnector, method) {
          expect(method).toBe(Get);
          const value = storageConnector.get(method);
          expect(value).toBe(2);
          return 50;
        },
        set(storageConnector, method, value) {
          expect(method).toBe(Get);
          storageConnector.set(method, value, Infinity);
          expect(mockStorage[buildNamespacedStorageKey(alova.id, Get)][0]).toBe(value);
        }
      },
      transformData: ({ data }: Result) => data
    });
    mockStorage[buildNamespacedStorageKey(alova.id, Get)] = [2, Infinity, null];
    const { onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
  });

  test('should change remove behavior when custom storage in method instance creating', async () => {
    const mockStorage = {} as Record<string, any>;
    const alova = createAlova({
      baseURL: 'http://localhost:3000',
      timeout: 3000,
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      responsed: r => r.json(),
      storageAdapter: {
        set(key, value) {
          mockStorage[key] = value;
        },
        get(key) {
          return mockStorage[key];
        },
        remove(key) {
          delete mockStorage[key];
        }
      }
    });
    const Get = alova.Get('/unit-test', {
      localCache: {
        expire: 500,
        mode: 'placeholder'
      },
      storage: {
        remove(storageConnector, method) {
          expect(method).toBe(Get);
          storageConnector.remove(method);
          expect(mockStorage[buildNamespacedStorageKey(alova.id, Get)]).toBeUndefined();
        }
      },
      transformData: ({ data }: Result) => data
    });
    useRequest(Get);
    await untilCbCalled(setTimeout, 800);

    // 缓存过期，将会调用remove
    const { onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
  });
});
