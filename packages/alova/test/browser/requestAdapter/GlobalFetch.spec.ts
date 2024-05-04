import { Result } from 'root/testUtils';
import { getAlovaInstance } from '#/utils';
import VueHook from '@/statesHook/vue';

describe('request adapter GlobalFetch', () => {
  test('the cache response data should be saved', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: 100 * 1000,
      transformData: ({ data }: Result, headers) => {
        expect(data).toStrictEqual({
          path: '/unit-test',
          method: 'GET',
          params: {}
        });
        expect(headers.get('content-type')).toBe('application/json');
        return data;
      }
    });
    await Get.send();
  });

  test('The Content-Type should be set to `application/json` defaultly', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const method = alova.Post<Record<string, any>>('/unit-test-headers', {});
    const { data } = await method.send();
    expect(data.requestHeaders['content-type']).toBe('application/json;charset=UTF-8');
  });

  test('The Content-Type should be what you set when set the Content-Type', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    let method = alova.Post<Record<string, any>>(
      '/unit-test-headers',
      {},
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    let res = await method.send();
    expect(res.data.requestHeaders['content-type']).toBe('application/x-www-form-urlencoded');

    method = alova.Post<Record<string, any>>(
      '/unit-test-headers',
      {},
      {
        headers: {
          'Content-Type': undefined
        }
      }
    );
    res = await method.send();
    expect(res.data.requestHeaders['content-type']).toBe('undefined');
  });

  test('The Content-Type should be undefined when pass the FormData', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    let method = alova.Post<Record<string, any>>('/unit-test-headers', new FormData());
    let res = await method.send();
    expect(res.data.requestHeaders['Content-Type']).toBeUndefined();

    method = alova.Post<Record<string, any>>('/unit-test-headers', new FormData(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    res = await method.send();
    expect(res.data.requestHeaders['content-type']).toBe('application/x-www-form-urlencoded');
  });
});
