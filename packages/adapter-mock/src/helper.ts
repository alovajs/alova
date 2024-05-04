export const undefinedValue = undefined;
export const nullValue = null;
export const trueValue = true;
export const falseValue = false;

/**
 * 空函数，做兼容处理
 */
export const noop = () => {};

/**
 * 判断参数是否为函数
 * @param fn 任意参数
 * @returns 该参数是否为函数
 */
export const isFn = (arg: any): arg is (...args: any) => any => typeof arg === 'function';

// 判断是否为某个类的实例
export const instanceOf = <T>(arg: any, cls: new (...args: any[]) => T): arg is T => arg instanceof cls;

/**
 * 判断参数是否为数字
 * @param arg 任意参数
 * @returns 该参数是否为数字
 */
export const isNumber = (arg: any): arg is number => typeof arg === 'number' && !Number.isNaN(arg);

/**
 * 判断参数是否为字符串
 * @param arg 任意参数
 * @returns 该参数是否为字符串
 */
export const isString = (arg: any): arg is string => typeof arg === 'string';

/**
 * 获取数据长度
 * @param data 数据
 * @returns 数据长度
 */
export const len = (data: any[] | Uint8Array | string) => data.length;

/**
 * 解析url
 * @param url url
 * @returns 解析后的信息对象
 */
export const parseUrl = (url: string) => {
  url = /^[^/]*\/\//.test(url) ? url : `//${url}`;
  const splitedFullPath = url.split('/').slice(3);
  const query = {} as Record<string, string>;
  let pathContainedParams = splitedFullPath.pop();
  let pathname = '';
  let hash = '';
  if (pathContainedParams) {
    pathContainedParams = pathContainedParams.replace(/\?[^?#]+/, mat => {
      // 解析url参数
      mat
        .substring(1)
        .split('&')
        .forEach(paramItem => {
          const [key, value] = paramItem.split('=');
          key && (query[key] = value);
        });
      return '';
    });
    pathContainedParams = pathContainedParams.replace(/#[^#]*/, mat => {
      hash = mat;
      return '';
    });
    splitedFullPath.push(pathContainedParams);
    pathname = `/${splitedFullPath.join('/')}`;
  }
  return {
    pathname,
    query,
    hash
  };
};
