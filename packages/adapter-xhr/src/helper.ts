import { AlovaXHRResponseHeaders } from '../typings';

export const undefinedValue = undefined,
  nullValue = null,
  trueValue = true,
  falseValue = false;

/**
 * 空函数，做兼容处理
 */
export const noop = () => {};

export type GeneralFn = (...args: any[]) => any;
/**
 * 判断参数是否为函数
 * @param fn 任意参数
 * @returns 该参数是否为函数
 */
export const isFn = (arg: any): arg is GeneralFn => typeof arg === 'function';

// 判断是否为某个类的实例
export const instanceOf = <T>(arg: any, cls: new (...args: any[]) => T): arg is T => arg instanceof cls;

/**
 * 判断参数是否为数字
 * @param arg 任意参数
 * @returns 该参数是否为数字
 */
export const isNumber = (arg: any): arg is number => typeof arg === 'number' && !isNaN(arg);

/**
 * 判断参数是否为字符串
 * @param arg 任意参数
 * @returns 该参数是否为字符串
 */
export const isString = (arg: any): arg is string => typeof arg === 'string';

// 判断是否为普通对象
export const isPlainObject = (arg: any): arg is Record<string, any> =>
  Object.prototype.toString.call(arg) === '[object Object]' && arg !== nullValue;

/**
 * 获取数据长度
 * @param data 数据
 * @returns 数据长度
 */
export const len = (data: any[] | Uint8Array | string) => data.length;

/**
 * 是否为特殊数据
 * @param data 提交数据
 * @returns 判断结果
 */
export const isSpecialRequestBody = (data: any) => {
  const dataTypeString = Object.prototype.toString.call(data);
  return (
    /^\[object (Blob|FormData|ReadableStream)\]$/i.test(dataTypeString) ||
    instanceOf(data, ArrayBuffer) ||
    instanceOf(data, URLSearchParams)
  );
};

/**
 * 创建错误对象
 * @param message 错误信息
 * @returns 错误对象
 */
export const err = (message: string) => new Error(message);

/**
 * 将对象转换为queryString字符串
 * 支持任意层级的数组或对象
 * @param data 转换的data实例
 */
export const data2QueryString = (data: Record<string, any>) => {
  const ary: string[] = [];
  let paths: string[] = [];
  let index = 0;
  let refValueAttrCount = 0;

  // 利用JSON.stringify来深度遍历数据
  JSON.stringify(data, (key, value) => {
    if (key !== '') {
      // 如果是引用类型（数组或对象）则进入记录路径
      if (typeof value === 'object' && value !== null) {
        paths.push(key);
        // 记录接下来路径的使用次数
        // 需要使用累加的方式，原因如下:
        /**
         * { a: [1, { b: 2 }] }
         */
        // 在数组中又包含数组或对象，此时refValueAttrCount还需要给{ b: 2 }使用一次，因此是累加的方式
        refValueAttrCount += Object.keys(value).length;
      } else if (value !== undefinedValue) {
        // 值为undefined不被加入到query string中
        const pathsTransformed = [...paths, key].map((val, i) => (i > 0 ? `[${val}]` : val)).join('');
        ary.push(`${pathsTransformed}=${value}`);

        // 路径次数使用完了，重置标记信息
        // 否则index++来记录当前使用的次数
        if (index >= refValueAttrCount - 1) {
          paths = [];
          index = refValueAttrCount = 0;
        } else {
          index++;
        }
      }
    }
    return value;
  });
  return ary.join('&');
};
/**
 * 解析响应头
 * @param headerString 响应头字符串
 * @returns 响应头对象
 */
export const parseResponseHeaders = (headerString: string) => {
  const headersAry = headerString.trim().split(/[\r\n]+/);
  const headersMap = {} as AlovaXHRResponseHeaders;
  headersAry.forEach(line => {
    const [headerName, value] = line.split(/:\s*/);
    headersMap[headerName] = value;
  });
  return headersMap;
};
