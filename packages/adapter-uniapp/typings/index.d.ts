/// <reference path="../node_modules/@dcloudio/types/index.d.ts" />
import { MockResponse } from '@alova/mock';
import { AlovaGlobalCacheAdapter, AlovaRequestAdapter } from 'alova';
import VueHook from 'alova/vue';

/**
 * uni.request请求额外参数
 */
export type UniappRequestConfig = Omit<
  UniNamespace.RequestOptions,
  'url' | 'data' | 'header' | 'method' | 'timeout' | 'success' | 'fail' | 'complete'
>;

/**
 * uni.uploadFile额外参数
 */
export type UniappUploadConfig = Omit<
  UniNamespace.UploadFileOption,
  'url' | 'files' | 'file' | 'filePath' | 'name' | 'header' | 'formData' | 'timeout' | 'success' | 'fail' | 'complete'
>;

/**
 * uni.downloadFile额外参数
 */
export type UniappDownloadConfig = Omit<
  UniNamespace.DownloadFileOption,
  'url' | 'header' | 'timeout' | 'success' | 'fail' | 'complete'
>;

/**
 * 合并的请求配置参数
 */
export type UniappConfig = {
  /**
   * 请求类型，upload表示上传，download表示下载，不填写表示正常请求
   */
  requestType?: 'upload' | 'download';
} & UniappRequestConfig &
  UniappUploadConfig &
  UniappDownloadConfig;

/**
 * uniapp请求适配器
 */
export type UniappRequestAdapter = AlovaRequestAdapter<
  UniappConfig,
  | UniNamespace.RequestSuccessCallbackResult
  | UniNamespace.UploadFileSuccessCallbackResult
  | UniNamespace.DownloadSuccessData,
  UniNamespace.RequestSuccessCallbackResult['header']
>;

export interface AdapterUniappOptions {
  mockRequest?: AlovaRequestAdapter<any, any, any>;
}

/**
 * uniapp请求适配器
 */
export declare const uniappRequestAdapter: UniappRequestAdapter;
/**
 * uniapp存储适配器
 */
export declare const uniappStorageAdapter: AlovaGlobalCacheAdapter;

/**
 * 适配器集合
 * @param options 请求配置参数
 */
declare function AdapterUniapp(options?: AdapterUniappOptions): {
  statesHook: typeof VueHook;
  requestAdapter: UniappRequestAdapter;
  storageAdapter: AlovaGlobalCacheAdapter;
};
export default AdapterUniapp;

/**
 * 模拟响应适配器，它用于@alova/mock中，让模拟请求时也能返回uniapp响应数据兼容的格式
 * @example
 * ```js
 * import AdapterUniapp, { uniappRequestAdapter } from '@alova/adapter-uniapp';
 *
 * const mockRequestAdapter = createAlovaMockAdapter([mocks], {
 *		delay: 1000,
 *		onMockResponse: mockResponse,
 *    httpAdapter: uniappRequestAdapter
 * });
 *	const alovaInst = createAlova({
 *		baseURL: 'http://xxx',
 *		...AdapterUniapp({
 *      mockAdapter: process.env.NODE_ENV === 'development' ? mockRequestAdapter : undefined
 *    }),
 *	});
 * ```
 */
export declare const uniappMockResponse: MockResponse<
  UniappConfig,
  | UniNamespace.RequestSuccessCallbackResult
  | UniNamespace.UploadFileSuccessCallbackResult
  | UniNamespace.DownloadSuccessData,
  UniNamespace.RequestSuccessCallbackResult['header']
>;
