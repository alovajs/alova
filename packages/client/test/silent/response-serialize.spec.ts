import { mockRequestAdapter } from '#/mockData';
import useRequest from '@/hooks/core/useRequest';
import { setDependentAlova } from '@/hooks/silent/globalVariables';
import { storageGetItem } from '@/hooks/silent/storage/performers';
import createVirtualResponse from '@/hooks/silent/virtualResponse/createVirtualResponse';
import VueHook from '@/statesHook/vue';
import updateState from '@/updateState';
import { AlovaGlobalCacheAdapter, createAlova } from 'alova';
import { untilCbCalled } from 'root/testUtils';

// Automatically convert dummy data to data matching the serializer when responding to data persistence
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

    // First construct a cache with dummy data and serializability
    const Get = alovaInst.Get('/list', {
      name: 'test-get',
      cacheFor: {
        mode: 'restore',
        expire: Infinity
      },
      transform: (data: { total: number; list: number[] }) => data.list
    });
    const { onSuccess, data } = useRequest(Get);
    data; // Updates to this data can only be triggered after access
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

    // Check whether the data in the mock storage is as expected
    const deserializedStoragedData = await storageGetItem(Object.keys(mockStorage)[0]);
    const [deserializedResponse, expireTimestamp, tag] = deserializedStoragedData || [];
    expect(deserializedResponse.pop().source).toBe('tttt');
    expect(deserializedResponse.pop().getTime()).toBe(date.getTime());
    expect(expireTimestamp).toBeUndefined(); // When the expiration time is undefined, it means it will never expire.
    expect(tag).toBeUndefined();
  });
});
