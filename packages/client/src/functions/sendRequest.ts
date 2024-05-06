import { filterItem, mapItem, objectKeys, undefinedValue } from '@alova/shared/vars';
import { Arg } from 'alova';

/**
 * 构建完整的url
 * @param base baseURL
 * @param url 路径
 * @param params url参数
 * @returns 完整的url
 */
export const buildCompletedURL = (baseURL: string, url: string, params: Arg) => {
  // baseURL如果以/结尾，则去掉/
  baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  // 如果不是/或http协议开头的，则需要添加/
  url = url.match(/^(\/|https?:\/\/)/) ? url : `/${url}`;

  const completeURL = baseURL + url;

  // 将params对象转换为get字符串
  // 过滤掉值为undefined的
  const paramsStr = mapItem(
    filterItem(objectKeys(params), key => params[key] !== undefinedValue),
    key => `${key}=${params[key]}`
  ).join('&');
  // 将get参数拼接到url后面，注意url可能已存在参数
  return paramsStr
    ? +completeURL.includes('?')
      ? `${completeURL}&${paramsStr}`
      : `${completeURL}?${paramsStr}`
    : completeURL;
};

export default buildCompletedURL;
