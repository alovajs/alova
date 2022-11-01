import { rest } from 'msw';
import { setupServer } from 'msw/node';
import nodeFetch from 'node-fetch';
import 'web-streams-polyfill';
import { createAlova } from '../src';
import GlobalFetch from '../src/predefine/GlobalFetch';
import { AlovaRequestAdapterConfig, LocalCacheConfig, StatesHook } from '../typings';

// const [major] = versions.node.split('.');
(global as any).fetch = (window as any).fetch = nodeFetch;

// 防止Vue warn打印
const warn = console.warn;
console.warn = (...args: any[]) => {
	args = args.filter((a: any) => !/vue warn/i.test(a));
	if (args.length > 0) {
		warn.apply(console, args);
	}
};

// -------------------
// 服务模拟
const result = (code: number, req: any, res: any, ctx: any, hasBody = false, extraParams = {}) => {
	const ret = {
		code,
		msg: '',
		data: {
			path: req.url.pathname,
			method: req.method,
			params: {
				...(req.url.search || '')
					.replace('?', '')
					.split('&')
					.reduce((p: Record<string, any>, c: string) => {
						const [k, v] = c.split('=');
						p[k] = v;
						return p;
					}, {} as Record<string, any>),
				...extraParams
			}
		} as Record<string, any>
	};
	if (hasBody) {
		ret.data.data = req.body;
	}
	return res(ctx.json(ret));
};

const baseURL = 'http://localhost:3000';
const countMap = {} as Record<string, number>;
export const mockServer = setupServer(
	rest.get(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx)),
	rest.get(baseURL + '/unit-test-10s', (req, res, ctx) => {
		return new Promise(r => setTimeout(() => r(result(200, req, res, ctx)), 10000));
	}),
	rest.get(baseURL + '/unit-test-count', (req, res, ctx) => {
		const key = req.url.searchParams.get('countKey') || '';
		countMap[key] = countMap[key] || 0;
		return result(200, req, res, ctx, false, { count: countMap[key]++ });
	}),
	rest.get(baseURL + '/unit-test-404', () => {
		throw new Error('404');
	}),
	rest.post(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
	rest.delete(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
	rest.put(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
	rest.head(baseURL + '/unit-test', (_, res, ctx) => res(ctx.json({}))),
	rest.patch(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
	rest.options(baseURL + '/unit-test', (_, res, ctx) => res(ctx.json({})))
);

// -------------------------
// 辅助函数
export const untilCbCalled = <T>(setCb: (cb: (arg: T) => void, ...others: any[]) => void, ...args: any[]) =>
	new Promise<T>(resolve => {
		setCb(d => {
			resolve(d);
		}, ...args);
	});

type AdapterConfig = AlovaRequestAdapterConfig<any, any, RequestInit, Headers>;
export const getAlovaInstance = <S, E>(
	statesHook: StatesHook<S, E>,
	{
		localCache,
		beforeRequestExpect,
		responseExpect,
		resErrorExpect
	}: {
		localCache?: LocalCacheConfig;
		beforeRequestExpect?: (config: AlovaRequestAdapterConfig<any, any, RequestInit, Headers>) => void;
		responseExpect?: (jsonPromise: Promise<any>, config: AdapterConfig) => void;
		resErrorExpect?: (err: Error, config: AdapterConfig) => void;
	} = {}
) => {
	return createAlova({
		baseURL: 'http://localhost:3000',
		timeout: 3000,
		statesHook: statesHook,
		requestAdapter: GlobalFetch(),
		beforeRequest(config) {
			beforeRequestExpect && beforeRequestExpect(config);
			return config;
		},
		localCache,
		responsed: {
			onSuccess: (response, config) => {
				const jsonPromise = response.json();
				responseExpect && responseExpect(jsonPromise, config);
				return jsonPromise;
			},
			onError: (err, config) => {
				resErrorExpect && resErrorExpect(err, config);
			}
		}
	});
};
