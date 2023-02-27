import { useRequest } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { key } from '../../../src/utils/helper';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

// 其他请求方式测试
describe('Request by other data', function () {
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

    const f = new FormData();
    f.append('post1', 'a');
    f.append('post2', 'b');
    const Post = alova.Post('/unit-test', f, {
      transformData({ data }: Result<true>) {
        return data;
      }
    });

    expect(key(Post)).toBe('["POST","/unit-test",{},{"post1":"a","post2":"b"},{}]');
    const { onSuccess } = useRequest(Post);
    const { data } = await untilCbCalled(onSuccess);
    expect(data).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: { p1: 'a' },
      data: '[object FormData]'
    });
  });

  test('send POST with string', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: async r => r.json()
    });

    const Post = alova.Post('/unit-test', 'a=1&b=2', {
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
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
  });

  test('send POST with Blob', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: async r => r.json()
    });

    const b = new Blob(['<span>xxx</span>'], { type: 'text/html' });
    const Post = alova.Post('/unit-test', b, {
      transformData({ data }: Result<true>) {
        return data;
      }
    });

    expect(key(Post)).toBe('["POST","/unit-test",{},{},{}]');
    const { onSuccess } = useRequest(Post);
    const { data } = await untilCbCalled(onSuccess);
    expect(data).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: '[object Blob]'
    });
  });
});
