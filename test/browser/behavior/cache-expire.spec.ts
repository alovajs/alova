import { useRequest } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('cache data', function () {
	test("change the default localCache's setting Globally", async () => {
		const alova = getAlovaInstance(VueHook, {
			localCache: {
				POST: 300000
			}
		});

		// GET请求不再有默认的缓存设置
		const Get = alova.Get('/unit-test', {
			transformData: ({ data }: Result) => data
		});
		const firstState = useRequest(Get);
		await untilCbCalled(firstState.onSuccess);
		const secondState = useRequest(Get);
		expect(secondState.loading.value).toBeTruthy(); // 因为GET没有缓存设置了，因此会发起请求

		// POST有了缓存
		const Post = alova.Post('/unit-test', undefined, {
			transformData: ({ data }: Result) => data
		});
		const thirdState = useRequest(Post);
		await untilCbCalled(thirdState.onSuccess);
		expect(thirdState.data.value).toEqual({
			path: '/unit-test',
			method: 'POST',
			params: {},
			data: '{}'
		});
		const postCache = getResponseCache(alova.id, key(Post));
		expect(postCache).toEqual({
			path: '/unit-test',
			method: 'POST',
			params: {},
			data: '{}'
		});
	});

	test('should hit the cache data when re request the same url with the same arguments', async () => {
		const alova = getAlovaInstance(VueHook);
		const Get = alova.Get('/unit-test', {
			localCache: 500,
			transformData: ({ data }: Result) => data
		});
		const firstState = useRequest(Get);
		await untilCbCalled(firstState.onSuccess);
		const secondState = useRequest(Get);
		expect(secondState.loading.value).toBe(false); // 因为使用缓存，所以不会发起请求，loading不会改变
		await new Promise(resolve => setTimeout(resolve, 0));
		// 使用缓存时，将会立即获得数据
		expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });

		await new Promise(resolve => setTimeout(resolve, 600));
		const thirdState = useRequest(Get);
		expect(thirdState.loading.value).toBe(true); // 因为缓存已过期，所以会重新发起请求，loading会改变
	});

	test('param localCache can also set to be a Date instance', async () => {
		const alova = getAlovaInstance(VueHook);
		const expireDate = new Date();
		expireDate.setTime(expireDate.getTime() + 500);
		const Get = alova.Get('/unit-test', {
			localCache: expireDate,
			transformData: ({ data }: Result) => data
		});
		const firstState = useRequest(Get);
		await untilCbCalled(firstState.onSuccess);
		const secondState = useRequest(Get);
		expect(secondState.loading.value).toBe(false); // 因为使用缓存，所以不会发起请求，loading不会改变
		await new Promise(resolve => setTimeout(resolve, 0));
		// 使用缓存时，将会立即获得数据
		expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });

		await new Promise(resolve => setTimeout(resolve, 600));
		const thirdState = useRequest(Get);
		expect(thirdState.loading.value).toBe(true); // 因为缓存已过期，所以会重新发起请求，loading会改变
	});

	test("cache data wouldn't be invalid when set localCache to `Infinity`", async () => {
		const alova = getAlovaInstance(VueHook);
		const Get = alova.Get('/unit-test', {
			localCache: Infinity,
			transformData: ({ data }: Result) => data
		});
		const firstState = useRequest(Get);
		await untilCbCalled(firstState.onSuccess);

		const secondState = useRequest(Get);
		expect(secondState.loading.value).toBe(false); // 因为使用缓存，所以不会发起请求，loading不会改变
		await untilCbCalled(setTimeout, 0);
		// 使用缓存时，将会立即获得数据
		expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });

		await untilCbCalled(setTimeout, 1000);
		const thirdState = useRequest(Get);
		expect(thirdState.loading.value).toBe(false); // 因为缓存未过期，所以继续使用缓存数据，loading不会改变
	});
});
