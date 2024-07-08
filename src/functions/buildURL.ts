import { Arg, ParamsSerializer } from '~/typings';
import qs from 'qs';

/**
 * 构建完整的url
 * @param baseURL baseURL
 * @param url 路径
 * @param params url参数
 * @param paramsSerializer 参数序列化
 * @returns 完整的url
 */
export function buildCompletedURL(baseURL: string, url: string, params: Arg, paramsSerializer?: ParamsSerializer) {
  // 如果不是/或http协议开头的，则需要添加/
  url = url.match(/^(\/|https?:\/\/)/) ? url : `/${url}`;

  // 忽略 url 中 # 后面的内容
  const urlHashIndex = url.indexOf('#');

  if (urlHashIndex !== -1) {
    url = url.slice(0, urlHashIndex);
  }

  const fullPath = buildFullPath(baseURL, url);

  return buildUrlParams(fullPath, params, paramsSerializer ?? defaultParamsSerializer);
}

/**
 * 构建完整 url 路径
 * @param baseURL baseURL
 * @param url 路径
 */
export function buildFullPath(baseURL: string, url: string) {
  // baseURL如果以/结尾，则去掉/
  const _baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;

  return _baseURL + url;
}

/**
 * 构建 url 查询参数
 * @param url url
 * @param params 查询参数
 * @param paramsSerializer 参数序列化
 */
export function buildUrlParams(url: string, params: Arg, paramsSerializer: ParamsSerializer) {
  const paramsStr = paramsSerializer(params);

  if (!paramsStr) return url;

  // 将get参数拼接到url后面，注意url可能已存在参数
  return url.includes('?') ? `${url}&${paramsStr}` : `${url}?${paramsStr}`;
}

/**
 * 默认的参数序列化
 * 使用 qs 序列化参数
 * @param params 参数
 */
export const defaultParamsSerializer: ParamsSerializer = (params?: Arg) => {
  // 将params对象转换为get字符串
  // 过滤掉值为undefined的

  if (!params) return '';

  return qs.stringify(params);
};
