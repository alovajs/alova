import { mockRequestAdapter } from '#/mockData';
import useRequest from '@/hooks/core/useRequest';
import { setDependentAlova } from '@/hooks/silent/globalVariables';
import { storageGetItem } from '@/hooks/silent/storage/performers';
import createVirtualResponse from '@/hooks/silent/virtualResponse/createVirtualResponse';
import updateState from '@/updateState';
import { AlovaGlobalCacheAdapter, createAlova } from 'alova';
import VueHook from '@/statesHook/vue';
import { untilCbCalled } from 'root/testUtils';

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
        set(key, value) {
          mockStorage[key] = value;
        },
        get(key) {
          return mockStorage[key];
        },
        remove(key) {
          delete mockStorage[key];
        },
        clear() {
          mockStorage = {};
        }
      } as AlovaGlobalCacheAdapter
    });
    setDependentAlova(alovaInst);

    // 先构造一个带虚拟数据和可序列化的缓存
    const Get = alovaInst.Get('/list', {
      name: 'test-get',
      cacheFor: {
        mode: 'restore',
        expire: Infinity
      },
      transform: (data: { total: number; list: number[] }) => data.list
    });
    const { onSuccess, data } = useRequest(Get);
    data; // 访问后才能触发此数据的更新
    await untilCbCalled(onSuccess);
    const vData = createVirtualResponse(100);
    const date = new Date('2022-10-01 00:00:00');
    const methodSnapshot = alovaInst.snapshots.match('test-get', false);
    if (methodSnapshot) {
      await updateState(methodSnapshot, listRaw => {
        listRaw.push(vData, date, /tttt/);
        return listRaw;
      });
    }

    // 查看mockStorage内的数据是否如预期
    const deserializedStoragedData = await storageGetItem(Object.keys(mockStorage)[0]);
    const [deserializedResponse, expireTimestamp, tag] = deserializedStoragedData || [];
    expect(deserializedResponse.pop().source).toBe('tttt');
    expect(deserializedResponse.pop().getTime()).toBe(date.getTime());
    expect(expireTimestamp).toBeUndefined(); // 过期时间为undefined时表示永不过期
    expect(tag).toBeUndefined();
  });
});
