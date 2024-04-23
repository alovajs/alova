import { JSONStringify, undefinedValue } from '@alova/shared/vars';
import { AlovaXHRResponseHeaders } from '~/typings';

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
  JSONStringify(data, (key, value) => {
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
