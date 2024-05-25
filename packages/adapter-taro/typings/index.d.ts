import { MockResponse } from '@alova/mock';
import Taro from '@tarojs/taro';
import { AlovaGlobalCacheAdapter, AlovaRequestAdapter } from 'alova';
import ReactHook from 'alova/react';

/**
 * Taro.request请求额外参数
 */
export type TaroRequestConfig = Omit<
  Taro.request.Option,
  'url' | 'data' | 'header' | 'method' | 'timeout' | 'success' | 'fail' | 'complete'
>;

/**
 * Taro.uploadFile额外参数
 */
export type TaroUploadConfig = Omit<
  Taro.uploadFile.Option,
  'url' | 'filePath' | 'name' | 'header' | 'formData' | 'timeout' | 'success' | 'fail' | 'complete'
>;

/**
 * Taro.downloadFile额外参数
 */
export type TaroDownloadConfig = Omit<
  Taro.downloadFile.Option,
  'url' | 'header' | 'timeout' | 'success' | 'fail' | 'complete'
>;

/**
 * 合并的请求配置参数
 */
export type TaroConfig = {
  /**
   * 请求类型，upload表示上传，download表示下载，不填写表示正常请求
   */
  requestType?: 'upload' | 'download';
} & TaroRequestConfig &
  TaroUploadConfig &
  TaroDownloadConfig;

export interface AdapterTaroOptions {
  mockRequest?: AlovaRequestAdapter<any, any, any>;
}

/**
 * taro请求适配器
 */
export type TaroRequestAdapter = AlovaRequestAdapter<
  TaroConfig,
  | Taro.uploadFile.SuccessCallbackResult
  | Taro.downloadFile.FileSuccessCallbackResult
  | Taro.request.SuccessCallbackResult<any>,
  Taro.request.SuccessCallbackResult<any>['header']
>;

/**
 * taro请求适配器
 */
export declare const taroRequestAdapter: TaroRequestAdapter;
/**
 * taro存储适配器
 */
export declare const taroStorageAdapter: AlovaGlobalCacheAdapter;

/**
 * 适配器集合
 * @param options 请求配置参数
 */
declare function AdapterTaro(options?: AdapterTaroOptions): {
  statesHook: typeof ReactHook;
  requestAdapter: TaroRequestAdapter;
  storageAdapter: AlovaGlobalCacheAdapter;
};
export default AdapterTaro;

/**
 * 模拟响应适配器，它用于@alova/mock中，让模拟请求时也能返回Taro响应数据兼容的格式
 * @example
 * ```js
 * import AdapterTaro, { taroRequestAdapter } from '@alova/adapter-taro';
 *
 * const mockRequestAdapter = createAlovaMockAdapter([mocks], {
 *		delay: 1000,
 *		onMockResponse: mockResponse,
 *    httpAdapter: taroRequestAdapter
 * });
 *	const alovaInst = createAlova({
 *		baseURL: 'http://xxx',
 *		...AdapterTaro({
 *      mockAdapter: process.env.NODE_ENV === 'development' ? mockRequestAdapter : undefined
 *    }),
 *	});
 * ```
 */
export declare const taroMockResponse: MockResponse<
  TaroConfig,
  | Taro.uploadFile.SuccessCallbackResult
  | Taro.downloadFile.FileSuccessCallbackResult
  | Taro.request.SuccessCallbackResult<any>,
  Taro.request.SuccessCallbackResult<any>['header']
>;
