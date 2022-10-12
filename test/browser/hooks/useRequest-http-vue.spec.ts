import { useRequest } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('use useRequet hook to send GET with vue', function () {
	test('init and send get request', async () => {
		const alova = getAlovaInstance(VueHook);
		const Get = alova.Get('/unit-test', {
			params: { a: 'a', b: 'str' },
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json'
			},
			transformData(result: Result, _) {
				expect(result.code).toBe(200);
				expect(result.data.path).toBe('/unit-test');
				expect(result.data.params).toEqual({ a: 'a', b: 'str' });
				return result.data;
			},
			localCache: 100 * 1000
		});
		const { loading, data, downloading, error, onSuccess } = useRequest(Get);
		expect(loading.value).toBeTruthy();
		expect(data.value).toBeUndefined();
		expect(downloading.value).toEqual({ total: 0, loaded: 0 });
		expect(error.value).toBeUndefined();

		const rawData = await untilCbCalled(onSuccess);
		expect(loading.value).toBeFalsy();
		expect(data.value.path).toBe('/unit-test');
		expect(data.value.params).toEqual({ a: 'a', b: 'str' });
		expect(rawData.path).toBe('/unit-test');
		expect(rawData.params).toEqual({ a: 'a', b: 'str' });
		expect(downloading.value).toEqual({ total: 0, loaded: 0 });
		expect(error.value).toBeUndefined();

		// 缓存有值
		const cacheData = getResponseCache(alova.id, key(Get));
		expect(cacheData.path).toBe('/unit-test');
		expect(cacheData.params).toEqual({ a: 'a', b: 'str' });
	});

	test('send get with request error', async () => {
		const alova = getAlovaInstance(VueHook, {
			resErrorExpect: error => {
				console.log('error callback', error.message);
				expect(error.message).toMatch(/404/);
			}
		});
		const Get = alova.Get<string, Result<string>>('/unit-test-404', {
			localCache: {
				expire: 100 * 1000
			}
		});
		const { loading, data, downloading, error, onError } = useRequest(Get);
		expect(loading.value).toBeTruthy();
		expect(data.value).toBeUndefined();
		expect(downloading.value).toEqual({ total: 0, loaded: 0 });
		expect(error.value).toBeUndefined();

		const err = await untilCbCalled(onError);
		expect(loading.value).toBeFalsy();
		expect(data.value).toBeUndefined();
		expect(downloading.value).toEqual({ total: 0, loaded: 0 });
		expect(error.value).toBeInstanceOf(Error);
		expect(error.value).toBe(err);

		// 请求错误无缓存
		const cacheData = getResponseCache(alova.id, key(Get));
		expect(cacheData).toBeUndefined();
	});

	test('send get with responseCallback error', async () => {
		const alova = getAlovaInstance(VueHook, {
			responseExpect: () => {
				throw new Error('responseCallback error');
			},
			resErrorExpect: error => {
				console.log('error responseCallback', error.message);
				expect(error.message).toMatch(/responseCallback error/);
			}
		});
		const Get = alova.Get<string, Result<string>>('/unit-test');
		const { loading, data, downloading, error, onError } = useRequest(Get);
		expect(loading.value).toBeTruthy();
		expect(data.value).toBeUndefined();
		expect(downloading.value).toEqual({ total: 0, loaded: 0 });
		expect(error.value).toBeUndefined();

		const err = await untilCbCalled(onError);
		expect(loading.value).toBeFalsy();
		expect(data.value).toBeUndefined();
		expect(downloading.value).toEqual({ total: 0, loaded: 0 });
		expect(error.value).toBeInstanceOf(Object);
		expect(error.value).toBe(err);
	});

	test('abort request when timeout', async () => {
		const alova = getAlovaInstance(VueHook, {
			resErrorExpect: error => {
				console.log('error timeout', error.message);
				expect(error.message).toMatch(/network timeout/);
			}
		});
		const Get = alova.Get<string, Result<string>>('/unit-test-10s', { timeout: 500 });
		const { loading, data, error, onError } = useRequest(Get);
		expect(loading.value).toBeTruthy();
		expect(data.value).toBeUndefined();
		expect(error.value).toBeUndefined();

		const err = await untilCbCalled(onError);
		expect(loading.value).toBeFalsy();
		expect(data.value).toBeUndefined();
		expect(error.value).toBeInstanceOf(Object);
		expect(error.value).toBe(err);
	});

	test('manual abort request', async () => {
		const alova = getAlovaInstance(VueHook, {
			resErrorExpect: error => {
				console.log('manual abort', error.message);
				expect(error.message).toMatch(/user aborted a request/);
			}
		});
		const Get = alova.Get<string, Result<string>>('/unit-test-10s');
		const { loading, data, error, abort, onError } = useRequest(Get);
		expect(loading.value).toBeTruthy();
		expect(data.value).toBeUndefined();
		expect(error.value).toBeUndefined();
		setTimeout(abort, 100);

		const err = await untilCbCalled(onError);
		expect(loading.value).toBeFalsy();
		expect(data.value).toBeUndefined();
		expect(error.value).toBeInstanceOf(Object);
		expect(error.value).toBe(err);
	});

	test('it can pass custom params when call `send` function, and the function will return a Promise instance', async () => {
		const alova = getAlovaInstance(VueHook);
		const getGetter = (data: { a: string; b: string }) =>
			alova.Get('/unit-test', {
				timeout: 10000,
				transformData: ({ data }: Result<true>) => data,
				params: {
					a: data.a,
					b: data.b
				}
			});

		const { data, send, onSuccess, onComplete } = useRequest(data => getGetter(data), {
			immediate: false
		});
		onSuccess((data, obj) => {
			expect(data.path).toBe('/unit-test');
			expect(obj.a).toMatch(/~|\./);
			expect(obj.b).toMatch(/~|\./);
		});
		onComplete(obj => {
			expect(obj.a).toMatch(/~|\./);
			expect(obj.b).toMatch(/~|\./);
		});

		// 延迟一会儿发送请求
		await untilCbCalled(setTimeout, 500);
		const sendObj = { a: '~', b: '~' };
		let rawData = await send(sendObj);
		expect(rawData.path).toBe('/unit-test');
		expect(rawData.params.a).toBe('~');
		expect(data.value.params.b).toBe('~');
		let cacheData: typeof data.value = getResponseCache(alova.id, key(getGetter(sendObj)));
		expect(cacheData.params).toEqual(sendObj);

		const sendObj2 = { a: '.', b: '.' };
		rawData = await send(sendObj2);
		expect(rawData.params.a).toBe('.');
		expect(data.value.params.b).toBe('.');
		cacheData = getResponseCache(alova.id, key(getGetter(sendObj2)));
		expect(cacheData.params).toEqual(sendObj2);
	});

	test('should throw a request error when request error at calling `send` function', async () => {
		const alova = getAlovaInstance(VueHook);
		const getGetter = (index: number) =>
			alova.Get('/unit-test-404', {
				transformData: ({ data }: Result<true>) => data,
				params: {
					index
				}
			});

		const { send, onError, onComplete } = useRequest((index: number) => getGetter(index), {
			immediate: false
		});

		onError((err, index) => {
			console.log('error passed params', index);
			expect(err.message).toMatch(/404/);
			expect(index.toString()).toMatch(/3|5/);
		});
		onComplete(index => {
			expect(index.toString()).toMatch(/3|5/);
		});

		// 延迟一会儿发送请求
		await untilCbCalled(setTimeout, 500);
		try {
			const data = await send(3);
			expect(data.path).toBe('/unit-test');
			expect(data.params.index).toEqual('3');
		} catch (err: any) {
			expect(err.message).toMatch(/404/);
		}
	});
});
