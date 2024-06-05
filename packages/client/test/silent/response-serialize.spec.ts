import { updateState, useRequest } from '@/index';
import { createAlova } from 'alova';
import VueHook from 'alova/vue';
import { untilCbCalled } from 'root/testUtils';
// import { setDependentAlova } from '../../src/hooks/silent/globalVariables';
import { storageGetItem } from '../../src/hooks/silent/storage/performers';
import createVirtualResponse from '../../src/hooks/silent/virtualResponse/createVirtualResponse';
import { mockRequestAdapter } from '../mockData';
import { setDependentAlova } from '@/hooks/silent/globalVariables';

// 响应数据持久化时，自动转换虚拟数据和匹配序列化器的数据
describe('serialize response data', () => {
  test('serialize response data with useRequest', async () => {
    let mockStorage = {} as Record<string, any>;
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false,
      l2Cache: {
        clear() {
          mockStorage = {};
        },
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
    setDependentAlova(alovaInst);

    // 先构造一个带虚拟数据和可序列化的缓存
    const Get = alovaInst.Get<number[], { total: number; list: number[] }>('/list', {
      cacheFor: {
        mode: 'restore',
        expire: Infinity
      },
      transformData: data => data.list
    });
    const { onSuccess, data } = useRequest(Get, { initialData: [] });
    await untilCbCalled(onSuccess);
    const vData = createVirtualResponse(100);
    const date = new Date('2022-10-01 00:00:00');
    updateState(Get, listRaw => {
      listRaw.push(vData, date as any, /tttt/ as any);
      return listRaw;
    });

    // 查看mockStorage内的数据是否如预期
    const deserializedStoragedData = storageGetItem(Object.keys(mockStorage)[0]);
    const [deserializedResponse, expireTimestamp, tag] = deserializedStoragedData || [];
    expect(data.value).toStrictEqual(deserializedResponse);
    expect(deserializedResponse.pop().source).toBe('tttt');
    expect(deserializedResponse.pop().getTime()).toBe(date.getTime());
    /**
     * change from alova 3.0
     * The default values for expired and tag were changed from null to undefined
     */
    expect(expireTimestamp).toBeUndefined();
    expect(tag).toBeUndefined();
  }, 1000000000);
});
