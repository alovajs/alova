import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { queryCache, useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';
import { key } from '@/utils/helper';

// 其他请求方式测试
describe('Request by other data', function () {
  (isSSR ? xtest : test)('send POST with FormData', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        method.config.params.p1 = 'a';
        method.config.headers.h1 = 'b';
        if (method.data instanceof FormData) {
          method.data.append('extra', 'zzz');
        }
      },
      responseExpect: async r => r.json()
    });

    const formData = new FormData();
    formData.append('post1', 'a');
    formData.append('post2', 'b');
    const Post = alova.Post('/unit-test', formData, {
      localCache: 100000,
      transformData({ data }: Result<true>) {
        return data;
      }
    });

    const { onSuccess } = useRequest(Post);
    const { data } = await untilCbCalled(onSuccess);
    expect(data).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: { p1: 'a' },
      data: '[object FormData]'
    });

    // 提交特殊数据时不会缓存
    expect(queryCache(Post)).toBeUndefined();
  });

  test('send POST with string', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: async r => r.json()
    });

    const Post = alova.Post('/unit-test', 'a=1&b=2', {
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      localCache: 100000,
      transformData({ data }: Result<true>) {
        return data;
      }
    });

    expect(key(Post)).toBe('["POST","/unit-test",{},"a=1&b=2",{"content-type":"application/x-www-form-urlencoded"}]');
    const { onSuccess } = useRequest(Post);
    const { data } = await untilCbCalled(onSuccess);
    expect(data).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: 'a=1&b=2'
    });

    // 字符串不是特殊数据，会进行缓存
    expect(queryCache(Post)).toStrictEqual(data);
  });

  (isSSR ? xtest : test)('send POST with Blob', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: async r => r.json()
    });

    const b = new Blob(['<span>xxx</span>'], { type: 'text/html' });
    const Post = alova.Post('/unit-test', b, {
      transformData({ data }: Result<true>) {
        return data;
      }
    });

    const { onSuccess } = useRequest(Post);
    const { data } = await untilCbCalled(onSuccess);
    expect(data).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: '[object Blob]'
    });

    // 提交特殊数据时不会缓存
    expect(queryCache(Post)).toBeUndefined();
  });
});
