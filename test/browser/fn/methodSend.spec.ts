import VueHook from '../../../src/predefine/VueHook';
import { Result } from '../result.type';
import { mockServer, getAlovaInstance } from '../../utils';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

const alova = getAlovaInstance(VueHook);
describe('method.send', function() {
  test('get success', async () => {
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(result: Result, _) {
        expect(result.code).toBe(200);
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        return result.data;
      },
      localCache: 100 * 1000,
    });

    const rawData = await Get.send();
    expect(rawData.path).toBe('/unit-test');
    expect(rawData.params).toEqual({ a: 'a', b: 'str' });
  });

  // test('get error', async () => {
  //   const Get = alova.Get<Result>('/unit-test-404', {
  //     params: { a: 'a', b: 'str' },
  //     timeout: 10000,
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   });
    
  //   expect(async () => {
  //     await Get.send();
  //   }).toThrowError();
  // });
});


