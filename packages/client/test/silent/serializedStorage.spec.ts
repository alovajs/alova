import { customSerializers, setCustomSerializers, setDependentAlova } from '@/hooks/silent/globalVariables';
import { SerializedSilentMethod, SilentMethod } from '@/hooks/silent/SilentMethod';
import convertPayload2SilentMethod from '@/hooks/silent/storage/convertPayload2SilentMethod';
import { storageGetItem, storageSetItem } from '@/hooks/silent/storage/performers';
import createVirtualResponse from '@/hooks/silent/virtualResponse/createVirtualResponse';
import dehydrateVData from '@/hooks/silent/virtualResponse/dehydrateVData';
import Null from '@/hooks/silent/virtualResponse/Null';
import Undefined from '@/hooks/silent/virtualResponse/Undefined';
import { symbolVDataId } from '@/hooks/silent/virtualResponse/variables';
import VueHook from '@/statesHook/vue';
import { createEventManager } from '@alova/shared';
import { AlovaGlobalCacheAdapter, createAlova, Method } from 'alova';
import GlobalFetch from 'alova/fetch';

// 虚拟响应测试
describe('serialized storage with virtual response', () => {
  test('add custom serializers', () => {
    setCustomSerializers({
      custom12: {
        forward: () => undefined,
        backward: () => undefined
      }
    });

    // 新增一个自定义序列化器
    expect(Object.keys(customSerializers)).toHaveLength(1);
  });

  test('serialized data must be the same as original data', () => {
    const mockStorage = {} as Record<string, any>;
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
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
        }
      } as AlovaGlobalCacheAdapter
    });
    setDependentAlova(alovaInst);
    setCustomSerializers({
      custom: {
        forward: (data: any) => (data === 'a,a' ? '2a' : undefined),
        backward: () => 'a,a'
      }
    });

    const dateObj = new Date('2022-10-01 00:00:00');
    const dateTimestamp = dateObj.getTime();
    const virtualResponse = createVirtualResponse({ id: 1, text: 'a,a', time: dateObj });
    const methodInstance = new Method(
      'POST',
      createAlova({
        baseURL: 'http://xxx',
        statesHook: VueHook,
        requestAdapter: GlobalFetch()
      }),
      '/list',
      {
        params: {
          id: virtualResponse.id,
          createDate: new Date('2022-10-01 00:00:00')
        },
        cacheFor: {
          expire: 500000
        }
      },
      { text: virtualResponse.text, time: virtualResponse.time }
    );
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      2,
      {
        delay: 2000,
        multiplier: 1.5
      }
    );
    silentMethodInstance.cache = true;
    silentMethodInstance.virtualResponse = virtualResponse;

    const storageKey = 'sm.test.1';
    storageSetItem(storageKey, silentMethodInstance);
    const serializedObj = mockStorage[storageKey] as SerializedSilentMethod;
    expect(typeof serializedObj.id).toBe('string');

    // 序列化的内容需要和原始数据一致，包括虚拟数据id
    expect(serializedObj.behavior).toBe('silent');
    expect(serializedObj.entity.config).toStrictEqual({
      cacheFor: {
        expire: 500000
      },
      headers: {},
      params: { id: { __$k: virtualResponse.id[symbolVDataId], __$v: 1 }, createDate: ['date', dateTimestamp] },
      shareRequest: true
    });
    expect(serializedObj.entity.data).toStrictEqual({
      text: { __$k: virtualResponse.text[symbolVDataId], __$v: ['custom', '2a'] },
      time: { __$k: virtualResponse.time[symbolVDataId], __$v: ['date', dateTimestamp] }
    });
    expect(serializedObj.entity.url).toBe(methodInstance.url);
    expect(serializedObj.entity.context).toBeUndefined();
    expect(serializedObj.entity.type).toBe(methodInstance.type);
    expect(serializedObj.entity.baseURL).toBe(methodInstance.baseURL);
    expect(serializedObj.retryError).toStrictEqual(['regexp', '.*']);
    expect(serializedObj.maxRetryTimes).toBe(2);
    expect(serializedObj.backoff).toStrictEqual({
      delay: 2000,
      multiplier: 1.5
    });
    expect(serializedObj.virtualResponse).toStrictEqual({
      __$k: virtualResponse[symbolVDataId],
      __$v: {},
      id: { __$k: virtualResponse.id[symbolVDataId], __$v: 1 },
      text: { __$k: virtualResponse.text[symbolVDataId], __$v: ['custom', '2a'] },
      time: { __$k: virtualResponse.time[symbolVDataId], __$v: ['date', dateTimestamp] }
    });
  });

  test('deserialized data must be the same as original data', async () => {
    const mockStorage = {} as Record<string, any>;
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
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
        }
      } as AlovaGlobalCacheAdapter
    });
    setDependentAlova(alovaInst);
    const virtualResponse = createVirtualResponse({
      id: 1,
      time: new Date('2022-10-01 00:00:00'),
      matcher: /^123[a-z]+(.*?)$/g,
      extra: {
        other1: null,
        other2: undefined
      }
    });
    const methodInstance = new Method(
      'POST',
      alovaInst,
      '/list',
      {
        params: {
          id: virtualResponse.id,
          content: 'I am a content',
          other1: virtualResponse.extra.other1
        },
        cacheFor: {
          expire: new Date('2022-12-31 00:00:00'),
          mode: 'memory'
        },
        transform: (data: any) => data[0]
      },
      {
        matcher: virtualResponse.matcher,
        time: virtualResponse.time,
        other1: virtualResponse.extra.other1,
        other2: virtualResponse.extra.other2,
        other3: virtualResponse.extra.other3
      }
    );
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      'abcdef',
      undefined,
      /.*/,
      2,
      {
        delay: 2000,
        multiplier: 1.5
      },
      undefined,
      undefined,
      [virtualResponse.extra.other2]
    );
    silentMethodInstance.cache = true;
    silentMethodInstance.virtualResponse = virtualResponse;
    silentMethodInstance.targetRefMethod = methodInstance;
    silentMethodInstance.updateStates = ['data', 'name'];

    const storageKey = 'sm.test.2';
    storageSetItem(storageKey, silentMethodInstance);
    const serializedObj = await storageGetItem(storageKey);
    const deserizlizedSilentMethodInstance = convertPayload2SilentMethod(serializedObj);

    expect(deserizlizedSilentMethodInstance.id).toBe(silentMethodInstance.id);
    expect(deserizlizedSilentMethodInstance.behavior).toBe(silentMethodInstance.behavior);
    expect(deserizlizedSilentMethodInstance.cache).toBeTruthy();
    expect(deserizlizedSilentMethodInstance.entity.url).toBe(methodInstance.url);
    expect(deserizlizedSilentMethodInstance.entity.type).toBe(methodInstance.type);
    expect(deserizlizedSilentMethodInstance.entity.baseURL).toBe(methodInstance.baseURL);

    const params = deserizlizedSilentMethodInstance.entity.config.params || {};
    expect(params.id[symbolVDataId]).toBe(virtualResponse.id[symbolVDataId]);
    expect(dehydrateVData(params.id)).toBe(dehydrateVData(virtualResponse.id));
    expect(params.content).toBe('I am a content');
    expect(params.other1[symbolVDataId]).toBe(virtualResponse.extra.other1[symbolVDataId]);
    expect(dehydrateVData(params.other1)).toBe(dehydrateVData(virtualResponse.extra.other1));

    const requestBody = (deserizlizedSilentMethodInstance.entity.data || {}) as any;
    expect(requestBody.matcher[symbolVDataId]).toBe(virtualResponse.matcher[symbolVDataId]);
    expect(requestBody.matcher.source).toBe('^123[a-z]+(.*?)$');
    expect(requestBody.time[symbolVDataId]).toBe(virtualResponse.time[symbolVDataId]);
    expect(requestBody.other1).toBeInstanceOf(Null);
    expect(requestBody.other2).toBeInstanceOf(Undefined);
    expect(requestBody.other3).toBeUndefined();

    expect((deserizlizedSilentMethodInstance.retryError as RegExp).source).toBe('.*');
    expect(deserizlizedSilentMethodInstance.maxRetryTimes).toBe(2);
    expect(deserizlizedSilentMethodInstance.backoff).toStrictEqual({
      delay: 2000,
      multiplier: 1.5
    });

    expect(deserizlizedSilentMethodInstance.handlerArgs?.[0][symbolVDataId]).toBe(
      virtualResponse.extra.other2[symbolVDataId]
    );
    expect(deserizlizedSilentMethodInstance.virtualResponse?.matcher[symbolVDataId]).toBe(
      virtualResponse.matcher[symbolVDataId]
    );
    expect(deserizlizedSilentMethodInstance.virtualResponse?.time[symbolVDataId]).toBe(
      virtualResponse.time[symbolVDataId]
    );

    expect(deserizlizedSilentMethodInstance.targetRefMethod?.url).toBe(methodInstance.url);
    expect(deserizlizedSilentMethodInstance?.targetRefMethod?.type).toBe(methodInstance.type);
    expect(deserizlizedSilentMethodInstance.targetRefMethod?.baseURL).toBe(methodInstance.baseURL);
    expect(deserizlizedSilentMethodInstance.updateStates).toStrictEqual(['data', 'name']);
  });
});
