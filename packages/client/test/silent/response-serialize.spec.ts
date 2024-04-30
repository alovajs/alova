import { createAlova, updateState, useRequest } from 'alova';
import VueHook from 'alova/vue';
import { setDependentAlova } from '../../src/hooks/silent/globalVariables';
import { storageGetItem } from '../../src/hooks/silent/storage/performers';
import createVirtualResponse from '../../src/hooks/silent/virtualResponse/createVirtualResponse';
import { mockRequestAdapter } from '../mockData';
import { untilCbCalled } from '../utils';

// 响应数据持久化时，自动转换虚拟数据和匹配序列化器的数据
describe('serialize response data', () => {
  test('serialize response data with useRequest', async () => {
    const mockStorage = {} as Record<string, any>;
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false,
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
    setDependentAlova(alovaInst);

    // 先构造一个带虚拟数据和可序列化的缓存
    const Get = alovaInst.Get('/list', {
      name: 'test-get',
      localCache: {
        mode: 'restore',
        expire: Infinity
      },
      transformData: (data: { total: number; list: number[] }) => data.list
    });
    const { onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
    const vData = createVirtualResponse(100);
    const date = new Date('2022-10-01 00:00:00');
    updateState('test-get', listRaw => {
      listRaw.push(vData, date, /tttt/);
      return listRaw;
    });

    // 查看mockStorage内的数据是否如预期
    const deserializedStoragedData = storageGetItem(Object.keys(mockStorage)[0]);
    const [deserializedResponse, expireTimestamp, tag] = deserializedStoragedData || [];
    expect(deserializedResponse.pop().source).toBe('tttt');
    expect(deserializedResponse.pop().getTime()).toBe(date.getTime());
    expect(expireTimestamp).toBeNull(); // 过期时间为null时表示永不过期
    expect(tag).toBeNull();
  });
});
