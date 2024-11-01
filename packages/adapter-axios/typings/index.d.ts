import { MockError, MockResponse } from '@alova/mock';
import { AlovaRequestAdapter } from 'alova';
import { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders } from 'axios';

/**
 * axios request configuration parameters
 */
export type AlovaAxiosRequestConfig = Omit<
  AxiosRequestConfig,
  | 'url'
  | 'method'
  | 'baseURL'
  | 'params'
  | 'data'
  | 'timeout'
  | 'cancelToken'
  | 'signal'
  | 'onUploadProgress'
  | 'onDownloadProgress'
>;

/**
 * axios request adapter
 */
export type AxiosRequestAdapter = AlovaRequestAdapter<AlovaAxiosRequestConfig, AxiosResponse, AxiosResponseHeaders>;

export interface AdapterCreateOptions {
  axios?: AxiosInstance;
}
/**
 * axios request adapter
 * @param options option parameters
 */
export declare function axiosRequestAdapter(options?: AdapterCreateOptions): AxiosRequestAdapter;

/**
 * Mock response adapter, which is used in @alova/mock to allow axios response data to be returned in a compatible format when simulating requests.
 * @example
 * ```js
 * import { axiosRequestAdapter, axiosMockResponse } from '@alova/adapter-axios';
 *
 * const mockRequestAdapter = createAlovaMockAdapter([mocks], {
 *		delay: 1000,
 *    httpAdapter: axiosRequestAdapter(),
 * 		...axiosMockResponse
 * });
 *	const alovaInst = createAlova({
 *		baseURL: 'http://xxx',
 *		requestAdapter: process.env.NODE_ENV === 'development'
 *			? mockRequestAdapter
 *			: axiosRequestAdapter(),
 *	});
 * ```
 */
export declare const axiosMockResponse: {
  onMockResponse: MockResponse<AlovaAxiosRequestConfig, AxiosResponse, AxiosResponse['headers']>;
  onMockError: MockError;
};
