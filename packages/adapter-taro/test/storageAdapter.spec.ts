import { buildNamespacedCacheKey } from '@alova/shared';
import Taro from '@tarojs/taro';
import { createAlova, invalidateCache } from 'alova';
import AdapterTaro from '../src/adapterReact';
import { mockStorageContainer } from './utils';

vi.mock('@tarojs/taro');
const alovaInst = createAlova({
  baseURL: 'http://xxx',
  responded(data) {
    const { data: subData } = data as Taro.request.SuccessCallbackResult<any>;
    if (subData) {
      return subData;
    }
    return null;
  },
  ...AdapterTaro()
});
interface ResponseData {
  url: string;
  method: string;
  data: any;
  header: Record<string, any>;
}

// 每个用例运行前清除缓存，避免相互影响
beforeEach(() => {
  // 清空所有存储
  for (const key in mockStorageContainer) {
    delete mockStorageContainer[key];
  }
  return invalidateCache();
});

describe('storage adapter', () => {
  test('set storage', async () => {
    const Get = alovaInst.Get<ResponseData>('/unit-test', {
      cacheFor: {
        mode: 'restore',
        expire: 100 * 1000
      }
    });

    await Get;

    /**
     * 缓存数据如下：
     * [{"url":"http://xxx/unit-test","method":"GET","header":{}},1677564705831]
     */
    const storagedData = mockStorageContainer[buildNamespacedCacheKey(alovaInst.id, Get.key)] || {};
    expect(storagedData[0]?.url).toBe('http://xxx/unit-test');
    expect(storagedData[0]?.method).toBe('GET');
    expect(storagedData[0]?.header).toStrictEqual({});
    expect(storagedData[2]).toBeUndefined();
  });

  test('remove storage', async () => {
    const Get = alovaInst.Get<ResponseData>('/unit-test', {
      cacheFor: {
        mode: 'restore',
        expire: 100 * 1000
      }
    });

    await Get;

    /**
     * 缓存数据如下：
     * [{"url":"http://xxx/unit-test","method":"GET","header":{}},1677564705831]
     */
    const getStoragedData = () => mockStorageContainer[buildNamespacedCacheKey(alovaInst.id, Get.key)];
    expect(getStoragedData()[0]).toStrictEqual({
      data: undefined,
      header: {},
      method: 'GET',
      url: 'http://xxx/unit-test'
    });

    invalidateCache(Get);
    expect(getStoragedData()).toBeUndefined();
  });

  test('clear should only remove alova cache', async () => {
    // 设置一些非alova的缓存
    Taro.setStorageSync('user-token', 'token-123');
    Taro.setStorageSync('user-info', { name: 'test', age: 20 });
    Taro.setStorageSync('app-settings', { theme: 'dark' });

    // 设置alova相关的缓存
    const Get = alovaInst.Get<ResponseData>('/unit-test', {
      cacheFor: {
        mode: 'restore',
        expire: 100 * 1000
      }
    });
    await Get;

    // 验证缓存已设置
    const alovaCacheKey = buildNamespacedCacheKey(alovaInst.id, Get.key);
    expect(mockStorageContainer[alovaCacheKey]).toBeDefined();
    expect(mockStorageContainer['user-token']).toBe('token-123');
    expect(mockStorageContainer['user-info']).toStrictEqual({ name: 'test', age: 20 });
    expect(mockStorageContainer['app-settings']).toStrictEqual({ theme: 'dark' });

    // 清除缓存
    invalidateCache();

    // 验证alova缓存被清除
    expect(mockStorageContainer[alovaCacheKey]).toBeUndefined();

    // 验证非alova缓存保留
    expect(mockStorageContainer['user-token']).toBe('token-123');
    expect(mockStorageContainer['user-info']).toStrictEqual({ name: 'test', age: 20 });
    expect(mockStorageContainer['app-settings']).toStrictEqual({ theme: 'dark' });
  });
});
