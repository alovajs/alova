import Taro from '@tarojs/taro';
import { createAlova, getMethodKey, invalidateCache } from 'alova';
import AdapterTaro from '../src/adapterReact';
import { mockStorageContainer } from './utils';

jest.mock('@tarojs/taro');
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
beforeEach(() => invalidateCache());

describe('storage adapter', () => {
  test('set storage', async () => {
    const Get = alovaInst.Get<ResponseData>('/unit-test', {
      cacheFor: {
        mode: 'placeholder',
        expire: 100 * 1000
      }
    });

    await Get.send();

    /**
     * 缓存数据如下：
     * [{"url":"http://xxx/unit-test","method":"GET","header":{}},1677564705831,null]
     */
    const storagedData = mockStorageContainer[`alova.${alovaInst.id}${getMethodKey(Get)}`] || {};
    expect(storagedData[0]?.url).toBe('http://xxx/unit-test');
    expect(storagedData[0]?.method).toBe('GET');
    expect(storagedData[0]?.header).toStrictEqual({});
    expect(storagedData[2]).toBeNull();
  });

  test('remove storage', async () => {
    const Get = alovaInst.Get<ResponseData>('/unit-test', {
      cacheFor: {
        mode: 'placeholder',
        expire: 100 * 1000
      }
    });

    await Get.send();

    /**
     * 缓存数据如下：
     * [{"url":"http://xxx/unit-test","method":"GET","header":{}},1677564705831,null]
     */
    const getStoragedData = () => mockStorageContainer[`alova.${alovaInst.id}${getMethodKey(Get)}`];
    expect(!!getStoragedData()).toBeTruthy();

    invalidateCache(Get);
    expect(!!getStoragedData()).toBeFalsy();
  });
});
