import { key } from '@alova/shared/function';
import { Result, delay, untilCbCalled } from 'root/testUtils';
import { getAlovaInstance } from '#/utils';
import { useRequest } from '@/index';
import VueHook from '@/statesHook/vue';
import { getResponseCache, removeResponseCache } from '@/storage/responseCache';
import { getPersistentResponse } from '@/storage/responseStorage';
import { DetailLocalCacheConfig } from '~/typings';

describe('persist data', () => {
  test('should persist responded data but it still send request when request again', async () => {
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
    const persisitentResponse = getPersistentResponse(alova.id, key(Get), alova.storage);
    expect(persisitentResponse).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'g' }
    });

    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));
    const secondState = useRequest(Get);

    await untilCbCalled(setTimeout);
    expect(secondState.data.value).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'g' }
    }); // 因为有持久化数据，因此直接带出了持久化的数据
    expect(secondState.loading.value).toBeTruthy(); // 即使有持久化数据，loading的状态也照样会是true

    await delay(600);
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
    await untilCbCalled(setTimeout);
    expect(secondState.data.value).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} }); // 因为有持久化数据，因此直接带出了持久化的数据
    expect(secondState.loading.value).toBeTruthy(); // 即使有持久化数据，loading的状态也照样会是true

    await delay(1000);
    const thirdState = useRequest(Get);
    await untilCbCalled(setTimeout);
    expect(thirdState.data.value).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} }); // 持久化数据用不过期
  });

  test('persistent data will restore even if the cache of the same key is invalid', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: {
        expire: 10 * 1000,
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

    // 设置为restore后，即使本地缓存失效了，也会自动将持久化数据恢复到缓存中，因此会命中缓存
    expect(secondState.loading.value).toBeTruthy(); // 刚开始会是true，恢复缓存后会改为false
    await untilCbCalled(setTimeout);
    expect(secondState.loading.value).toBeFalsy();
    // data是异步更新
    expect(secondState.data.value).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
  });

  test('should use the same expire timestamp when restore cache to memory', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: {
        expire: 500,
        mode: 'restore',
        tag: 'v10'
      },
      transformData: ({ data }: Result) => data
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);

    // 清除缓存后再过400毫秒请求让它恢复到内存缓存中，如果缓存时间一致的话，内存缓存将会在100毫秒后失效
    removeResponseCache(alova.id, key(Get));
    await delay(400);
    useRequest(Get);
    await delay(200);
    expect(getResponseCache(alova.id, key(Get))).toBeUndefined();
  });

  test('restore mode is valid even if using method instance', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      params: {
        vv: 10
      },
      localCache: {
        expire: 10 * 1000,
        mode: 'restore',
        tag: 'v1'
      },
      transformData: ({ data }: Result) => data
    });

    await Get;
    expect(Get.fromCache).toBeFalsy();
    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));

    await Get;
    // 设置为restore后，即使本地缓存失效了，也会自动将持久化数据恢复到缓存中，因此会命中缓存
    expect(Get.fromCache).toBeTruthy();
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
    expect(secondState.loading.value).toBeTruthy(); // 开始会是true，恢复缓存后会改为false
    await untilCbCalled(setTimeout);
    expect(secondState.loading.value).toBeFalsy();
    // data是异步更新
    expect(secondState.data.value).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
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
    expect(secondState.data.value).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
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
    expect(secondState.data.value).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
  });
});
