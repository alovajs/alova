import { AlovaRequestAdapter } from '.';

export type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;

/**
 * adapterFetch请求适配器
 */
export type FetchRequestAdapter = AlovaRequestAdapter<FetchRequestInit, Response, Headers>;

declare function adapterFetch(): FetchRequestAdapter;
export = adapterFetch;
