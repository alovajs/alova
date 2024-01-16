import { AlovaRequestAdapter } from '.';

export type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;

/**
 * GlobalFetch请求适配器
 */
export type GlobalFetchRequestAdapter = AlovaRequestAdapter<any, any, FetchRequestInit, Response, Headers>;

function GlobalFetch(): GlobalFetchRequestAdapter;
export = GlobalFetch;
