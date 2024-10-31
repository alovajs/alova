import { JSONStringify, undefinedValue } from '@alova/shared';
import { AlovaXHRResponseHeaders } from '~/typings';

/**
 * Convert object to queryString string
 * Supports arrays or objects at any level
 * @param data Converted data instance
 */
export const data2QueryString = (data: Record<string, any>) => {
  const ary: string[] = [];
  let paths: string[] = [];
  let index = 0;
  let refValueAttrCount = 0;

  // Use json.stringify to deeply traverse data
  JSONStringify(data, (key, value) => {
    if (key !== '') {
      // If it is a reference type (array or object), enter the record path
      if (typeof value === 'object' && value !== null) {
        paths.push(key);
        // Record the number of times the next path is used
        // It is necessary to use the accumulation method for the following reasons:
        /**
         * { a: [1, { b: 2 }] }
         */
        // If the array contains an array or object, then refValueAttrCount needs to be used once for { b: 2 }, so it is an accumulation method.
        refValueAttrCount += Object.keys(value).length;
      } else if (value !== undefinedValue) {
        // values ​​of undefined are not added to the query string.
        const pathsTransformed = [...paths, key].map((val, i) => (i > 0 ? `[${val}]` : val)).join('');
        ary.push(`${pathsTransformed}=${value}`);

        // The number of paths has been used up. Reset the mark information.
        // Otherwise, index++ is used to record the current number of uses.
        if (index >= refValueAttrCount - 1) {
          paths = [];
          index = 0;
          refValueAttrCount = 0;
        } else {
          index += 1;
        }
      }
    }
    return value;
  });
  return ary.join('&');
};
/**
 * Parse response headers
 * @param headerString Response header string
 * @returns Response header object
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
