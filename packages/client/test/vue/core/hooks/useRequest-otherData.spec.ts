import { getAlovaInstance } from '#/utils';
import { useRequest } from '@/index';
import VueHook from '@/statesHook/vue';
import { key } from '@alova/shared';
import { queryCache } from 'alova';
import { Result, untilCbCalled } from 'root/testUtils';

// Testing other request methods
describe('Request by other data', () => {
  test('send POST with FormData', async () => {
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
      cacheFor: 100000,
      transform({ data }: Result<true>) {
        return data;
      }
    });

    const { onSuccess } = useRequest(Post);
    const { data } = await untilCbCalled(onSuccess);
    expect(data).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: { p1: 'a' },
      data: {
        extra: 'zzz',
        post1: 'a',
        post2: 'b'
      }
    });

    // Special data is not cached when submitted
    expect(await queryCache(Post)).toBeUndefined();
  });

  test('send POST with string', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: async r => r.json()
    });

    const Post = alova.Post('/unit-test', 'a=1&b=2', {
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      cacheFor: 100000,
      transform({ data }: Result<true>) {
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
      data: {
        a: '1',
        b: '2'
      }
    });

    // Strings are not special data and will be cached.
    expect(await queryCache(Post)).toStrictEqual(data);
  });

  test('send POST with Blob', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: async r => r.json()
    });

    const b = new Blob(['<span>xxx</span>'], { type: 'text/html' });
    const Post = alova.Post('/unit-test', b, {
      transform({ data }: Result<true>) {
        return data;
      }
    });

    const { onSuccess } = useRequest(Post);
    const { data } = await untilCbCalled(onSuccess);
    expect(data).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: '<span>xxx</span>'
    });

    // Special data is not cached when submitted
    expect(await queryCache(Post)).toBeUndefined();
  });
});
