import { setCacheData } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { getAlovaInstance, mockServer } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

const alova = getAlovaInstance(VueHook);
describe('manual set cache response data', function () {
	test('the cache response data should be saved', () => {
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

	test('batch set response data', async () => {
		const Get1 = alova.Get('/unit-test', {
			name: 'test-get1',
			params: { a: 1 },
			localCache: 100 * 1000,
			transformData: ({ data }: Result) => data
		});
		const Get2 = alova.Get('/unit-test', {
			name: 'test-get1',
			params: { a: 2 },
			localCache: 100 * 1000,
			transformData: ({ data }: Result) => data
		});
		await Promise.all([Get1.send(), Get2.send()]);

		expect(getResponseCache(alova.id, key(Get1))).toEqual({
			path: '/unit-test',
			method: 'GET',
			params: {
				a: '1'
			}
		});
		expect(getResponseCache(alova.id, key(Get2))).toEqual({
			path: '/unit-test',
			method: 'GET',
			params: {
				a: '2'
			}
		});

		// 重新设置以上两个请求的缓存
		setCacheData('test-get1', {
			path: '/unit-test',
			method: 'GET',
			params: {
				manual: 123
			}
		});
		expect(getResponseCache(alova.id, key(Get1))).toEqual({
			path: '/unit-test',
			method: 'GET',
			params: {
				manual: 123
			}
		});
		expect(getResponseCache(alova.id, key(Get2))).toEqual({
			path: '/unit-test',
			method: 'GET',
			params: {
				manual: 123
			}
		});
	});

	test('batch update response data', async () => {
		const Get1 = alova.Get('/unit-test', {
			name: 'test-get2',
			params: { a: 55 },
			localCache: 100 * 1000,
			transformData: ({ data }: Result) => data
		});
		const Get2 = alova.Get('/unit-test', {
			name: 'test-get2',
			params: { a: 100 },
			localCache: 100 * 1000,
			transformData: ({ data }: Result) => data
		});
		await Promise.all([Get1.send(), Get2.send()]);

		expect(getResponseCache(alova.id, key(Get1))).toEqual({
			path: '/unit-test',
			method: 'GET',
			params: {
				a: '55'
			}
		});
		expect(getResponseCache(alova.id, key(Get2))).toEqual({
			path: '/unit-test',
			method: 'GET',
			params: {
				a: '100'
			}
		});

		// 更新以上两个请求的缓存
		const mockfn = jest.fn();
		setCacheData<Result['data']>('test-get2', cache => {
			cache.params.a = 'update';
			mockfn();
			return cache;
		});
		expect(getResponseCache(alova.id, key(Get1))).toEqual({
			path: '/unit-test',
			method: 'GET',
			params: {
				a: 'update'
			}
		});
		expect(getResponseCache(alova.id, key(Get2))).toEqual({
			path: '/unit-test',
			method: 'GET',
			params: {
				a: 'update'
			}
		});
		expect(mockfn).toBeCalledTimes(2); // 只有两个被匹配

		const mockfn2 = jest.fn();
		await Get2.send();
		setCacheData<Result['data']>('test-get2', cache => {
			cache.params.a = 'update2';
			mockfn2();
			return cache;
		});
		expect(mockfn).toBeCalledTimes(2); // 相同的Method请求不会被多次匹配
	});
});
