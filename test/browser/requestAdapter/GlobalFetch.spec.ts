import { setCacheData } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { getAlovaInstance, mockServer } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('request adapter GlobalFetch', function () {
  test('the cache response data should be saved', () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: 100 * 1000,
      transformData: ({ data }: Result) => data
    });
    setCacheData(Get, {
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '1'
      }
    });
    expect(getResponseCache(alova.id, key(Get))).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '1'
      }
    });
  });
});
