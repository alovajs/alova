import { getAlovaInstance } from '#/utils';
import { useRequest } from '@/index';
import VueHook from '@/statesHook/vue';
import { Method, queryCache } from 'alova';
import { Result, delay, untilCbCalled } from 'root/testUtils';

// Testing other request methods
describe('Test other methods without GET', () => {
  test('send POST with cache', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method).toBeInstanceOf(Method);
        const { config } = method;
        expect(method.url).toBe('/unit-test');
        expect(config.params).toStrictEqual({ a: 'a', b: 'str' });
        expect(method.data).toStrictEqual({ post1: 'a' });
        (method.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toStrictEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      responseExpect: async (r, method) => {
        expect(method).toBeInstanceOf(Method);
        const res = await r.json();
        const { data } = res;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toStrictEqual({ a: 'a', b: 'str' });
        return res;
      }
    });
    const Post = alova.Post(
      '/unit-test',
      { post1: 'a' },
      {
        params: { a: 'a', b: 'str' },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transform({ code, data }: Result<true>) {
          expect(code).toBe(200);
          expect(data.path).toBe('/unit-test');
          expect(data.params).toStrictEqual({ a: 'a', b: 'str' });
          expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
          return data;
        },
        cacheFor: {
          expire: 100 * 1000,
          mode: 'memory'
        }
      }
    );
    const { loading, data, error, onSuccess } = useRequest(Post);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toStrictEqual({ post1: 'a', post2: 'b' });
    expect(error.value).toBeUndefined();

    // Cache has value
    const cacheData = await queryCache(Post);
    expect(cacheData).not.toBeUndefined();
  });

  test('send DELETE with cache', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        const { config } = method;
        expect(method.url).toBe('/unit-test');
        expect(config.params).toStrictEqual({ a: 'a', b: 'str' });
        expect(method.data).toStrictEqual({ post1: 'a' });
        (method.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toStrictEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      responseExpect: async r => {
        const res = await r.json();
        const { data } = res;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toStrictEqual({ a: 'a', b: 'str' });
        return res;
      }
    });
    const Delete = alova.Delete(
      '/unit-test',
      { post1: 'a' },
      {
        params: { a: 'a', b: 'str' },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transform({ code, data }: Result<true>) {
          expect(code).toBe(200);
          expect(data.path).toBe('/unit-test');
          expect(data.params).toStrictEqual({ a: 'a', b: 'str' });
          expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
          return data;
        },
        cacheFor: 100 * 1000
      }
    );
    const { loading, data, error, onSuccess } = useRequest(Delete);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toStrictEqual({ post1: 'a', post2: 'b' });
    expect(error.value).toBeUndefined();

    // Cache has value
    const cacheData = await queryCache(Delete);
    expect(cacheData).not.toBeUndefined();
  });

  test('send PUT with cache', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        const { config } = method;
        expect(method.url).toBe('/unit-test?c=3');
        expect(config.params).toStrictEqual({ a: 'a', b: 'str' });
        expect(method.data).toStrictEqual({ post1: 'a' });
        (method.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toStrictEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      responseExpect: async r => {
        const res = await r.json();
        const { data } = res;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toStrictEqual({ a: 'a', b: 'str', c: '3' });
        return res;
      }
    });
    const Put = alova.Put(
      '/unit-test?c=3',
      { post1: 'a' },
      {
        params: { a: 'a', b: 'str' },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transform({ code, data }: Result<true>) {
          expect(code).toBe(200);
          expect(data.path).toBe('/unit-test');
          expect(data.params).toStrictEqual({ a: 'a', b: 'str', c: '3' });
          expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
          return data;
        },
        cacheFor: 100 * 1000
      }
    );
    const { loading, data, error, onSuccess } = useRequest(Put);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ a: 'a', b: 'str', c: '3' });
    expect(data.value.data).toStrictEqual({ post1: 'a', post2: 'b' });
    expect(error.value).toBeUndefined();

    // Cache has value
    const cacheData = await queryCache(Put);
    expect(cacheData).not.toBeUndefined();
  });

  test('send HEAD', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method.type).toBe('HEAD');
      },
      responseExpect: r => r.json()
    });
    const Head = alova.Head('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      transform(resp: Result, headers) {
        expect(headers.get('content-type')).toBe('application/json');
        return resp;
      }
    });
    const { loading, data, error, onSuccess } = useRequest(Head);

    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({});
    expect(error.value).toBeUndefined();
    // no cached value
    const cacheData = await queryCache(Head);
    expect(cacheData).toBeUndefined();
  });

  test('send OPTIONS', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method.type).toBe('OPTIONS');
      },
      responseExpect: r => r.json()
    });
    const Options = alova.Options('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      transform(resp: Result, headers) {
        expect(headers.get('content-type')).toBe('application/json');
        return resp;
      }
    });
    const { loading, data, error, onSuccess } = useRequest(Options);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({});
    expect(error.value).toBeUndefined();
    // no cached value
    const cacheData = await queryCache(Options);
    expect(cacheData).toBeUndefined();
  });

  test('send PATCH', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method.type).toBe('PATCH');
      },
      responseExpect: r => r.json()
    });
    const Patch = alova.Patch(
      '/unit-test',
      { patch1: 'p' },
      {
        params: { a: 'a', b: 'str' },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transform(resp: Result<true>, headers) {
          expect(headers.get('content-type')).toBe('application/json');
          return resp.data;
        }
      }
    );
    const { loading, data, error, onSuccess } = useRequest(Patch);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toStrictEqual({ patch1: 'p' });
    expect(error.value).toBeUndefined();
    // no cached value
    const cacheData = await queryCache(Patch);
    expect(cacheData).toBeUndefined();
  });

  test('send request with Request method', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const GetMethod = alova.Request({
      url: '/unit-test',
      params: { a: 'a', b: 'str' },
      cacheFor: 100 * 1000,
      transform(resp: Result, headers) {
        expect(headers.get('content-type')).toBe('application/json');
        return resp;
      }
    });
    expect(GetMethod.type).toBe('GET');
    expect(GetMethod.data).toBeUndefined();
    const { loading, data, error, onSuccess } = useRequest(GetMethod);

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({
      code: 200,
      data: {
        method: 'GET',
        params: {
          a: 'a',
          b: 'str'
        },
        path: '/unit-test'
      },
      msg: ''
    });
    expect(error.value).toBeUndefined();
    const cacheData = await queryCache(GetMethod);
    expect(cacheData).not.toBeUndefined();

    const PostMethod = alova.Request({
      url: '/unit-test',
      params: { a: 'a', b: 'str' },
      method: 'POST',
      data: {
        p1: 'a',
        p2: 'b'
      },
      transform(resp: Result<boolean>, headers) {
        expect(headers.get('content-type')).toBe('application/json');
        return resp.data;
      }
    });
    expect(PostMethod.type).toBe('POST');
    expect(PostMethod.data).toStrictEqual({
      p1: 'a',
      p2: 'b'
    });
    const { data: data2, onSuccess: onSuccess2 } = useRequest(PostMethod);
    await untilCbCalled(onSuccess2);
    expect(data2.value.path).toBe('/unit-test');
    expect(data2.value.params).toStrictEqual({ a: 'a', b: 'str' });
    expect(data2.value.data).toStrictEqual({ p1: 'a', p2: 'b' });
  });

  test('should download file and pass the right args with cache', async () => {
    const alovaInst = getAlovaInstance(VueHook);
    const Get = alovaInst.Get('/unit-test-download', {
      transform: (resp: Response) => resp.blob(),
      cacheFor: 100000
    });

    const { loading, data, downloading, error, onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeInstanceOf(Blob);
    expect(downloading.value).toStrictEqual({ total: 250569, loaded: 250569 });
    expect(error.value).toBeUndefined();

    // Upload/download callback mediation and binding will be triggered after the event response, so wait for 10ms before verifying whether to unbind.
    await delay(10);
    expect(Get.dhs).toHaveLength(0);

    // When there is cache, there is no more download information.
    const { downloading: downloading2, onSuccess: onSuccess2 } = useRequest(Get);
    await untilCbCalled(onSuccess2);
    expect(downloading2.value).toStrictEqual({ total: 0, loaded: 0 });
  });

  test('should abort the file downloading when abort request', async () => {
    const alovaInst = getAlovaInstance(VueHook);
    const Get = alovaInst.Get('/unit-test-download', {
      transform: (resp: Response) => resp.blob()
    });

    const { error, abort, onError } = useRequest(Get);
    delay(3).then(abort);
    const e = await untilCbCalled(onError);
    expect(error.value).toStrictEqual(e.error);
  });
});
