import { createAlova, Method } from 'alova';
import { createAlovaMockAdapter, defineMock } from '@alova/mock';
import { VueOptionsStateHook } from '@alova/vue-options';

const mockData = defineMock({
	'/unit-test': ({ query }) => ({
		path: '/unit-test',
		method: 'GET',
		params: query
	})
});

// create a alova instance
export const alovaInst = createAlova({
	baseURL: 'http://example.com',
	statesHook: VueOptionsStateHook,
	localCache: null,
	requestAdapter: createAlovaMockAdapter([mockData], {
		delay: 1500,
	}),
  responded: response => response.json()
});

/** @type {() => Method<unknown, unknown, { content: string, time: string }[]>} */
export const getData = () => alovaInst.Get('/unit-test', {
  params: { aa: 'a' }
})