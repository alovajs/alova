/// <reference path="../node_modules/@dcloudio/types/index.d.ts" />
import AdapterUniapp from '@/index';
import { buildNamespacedCacheKey } from '@alova/shared/function';
import { createAlova, invalidateCache } from 'alova';
import { mockStorageContainer } from './utils';

const alovaInst = createAlova({
  baseURL: 'http://xxx',
  responded(data) {
    const { data: subData } = data as UniNamespace.RequestSuccessCallbackResult;
    if (subData) {
      return subData;
    }
    return null;
  },
  ...AdapterUniapp()
});
interface ResponseData {
  url: string;
  method: string;
  data: any;
  header: Record<string, any>;
}

// 每个用例运行前清除缓存，避免相互影响
beforeEach(() => invalidateCache());

describe('storage adapter', () => {
  test('set storage', async () => {
    const Get = alovaInst.Get<ResponseData>('/unit-test', {
      cacheFor: {
        mode: 'restore',
        expire: 100 * 1000,
        tag: 'v1'
      }
    });

    await Get;

    /**
     * 缓存数据如下：
     * [{"url":"http://xxx/unit-test","method":"GET","header":{}},1677564705831]
     */
    const storagedData = mockStorageContainer[buildNamespacedCacheKey(alovaInst.id, Get.__key__)] || {};
    expect(storagedData[0]?.url).toBe('http://xxx/unit-test');
    expect(storagedData[0]?.method).toBe('GET');
    expect(storagedData[0]?.header).toStrictEqual({});
    expect(storagedData[2]).toBe('v1');
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
    const getStoragedData = () => mockStorageContainer[buildNamespacedCacheKey(alovaInst.id, Get.__key__)];
    expect(getStoragedData()[0]).toStrictEqual({
      data: undefined,
      header: {},
      method: 'GET',
      url: 'http://xxx/unit-test'
    });

    invalidateCache(Get);
    expect(getStoragedData()).toBeUndefined();
  });
});
