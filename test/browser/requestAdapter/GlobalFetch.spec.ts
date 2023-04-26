import VueHook from '../../../src/predefine/VueHook';
import { getAlovaInstance, Result } from '../../utils';

describe('request adapter GlobalFetch', function () {
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
        expect(headers.get('x-powered-by')).toBe('msw');
        return data;
      }
    });
    await Get.send();
  });
});
