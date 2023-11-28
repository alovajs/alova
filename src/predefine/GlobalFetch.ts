import alovaError from '@/utils/alovaError';
import { isSpecialRequestBody, isString } from '@/utils/helper';
import {
  JSONStringify,
  ObjectCls,
  clearTimeoutTimer,
  falseValue,
  len,
  promiseReject,
  promiseThen,
  setTimeoutFn,
  trueValue
} from '@/utils/variables';
import { Method, RequestElements } from '~/typings';
import { FetchRequestInit } from '~/typings/globalfetch';

const isBodyData = (data: any): data is BodyInit => isString(data) || isSpecialRequestBody(data);
export default function GlobalFetch() {
  return function (elements: RequestElements, method: Method<any, any, any, any, FetchRequestInit, Response, Headers>) {
    const adapterConfig = method.config,
      timeout = adapterConfig.timeout || 0,
      ctrl = new AbortController(),
      { data, headers } = elements,
      isContentTypeSet = /content-type/i.test(ObjectCls.keys(headers).join()),
      isDataFormData = data && data.toString() === '[object FormData]';

    // 未设置Content-Type并且data不是FormData对象时，默认设置Content-Type为application/json
    if (!isContentTypeSet && !isDataFormData) {
      headers['Content-Type'] = 'application/json;charset=UTF-8';
    }
    const fetchPromise = fetch(elements.url, {
      ...adapterConfig,
      method: elements.type,
      signal: ctrl.signal,
      body: isBodyData(data) ? data : JSONStringify(data)
    });

    // 设置了中断时间，则在指定时间后中断请求
    let abortTimer: NodeJS.Timeout | number,
      isTimeout = falseValue;
    if (timeout > 0) {
      abortTimer = setTimeoutFn(() => {
        isTimeout = trueValue;
        ctrl.abort();
      }, timeout);
    }

    return {
      response: () =>
        promiseThen(
          fetchPromise,
          response => {
            // 请求成功后清除中断处理
            clearTimeoutTimer(abortTimer);

            // Response的Readable只能被读取一次，需要克隆才可重复使用
            return response.clone();
          },
          err => promiseReject(alovaError(isTimeout ? 'fetchError: network timeout' : err.message))
        ),

      // headers函数内的then需捕获异常，否则会导致内部无法获取到正确的错误对象
      headers: () =>
        promiseThen(
          fetchPromise,
          ({ headers }) => headers,
          () => ({} as Headers)
        ),
      // 因nodeFetch库限制，这块代码无法进行单元测试，但已在浏览器中通过测试
      /* c8 ignore start */
      onDownload: (cb: (total: number, loaded: number) => void) => {
        promiseThen(fetchPromise, response => {
          const { headers, body } = response.clone(),
            reader = body?.getReader().read(),
            total = Number(headers.get('Content-Length') || headers.get('content-length') || 0);
          if (total <= 0) {
            return;
          }
          let loaded = 0;
          const progressTimer = setInterval(() => {
            reader &&
              promiseThen(reader, ({ done, value = new Uint8Array() }) => {
                done && clearInterval(progressTimer);
                loaded += len(value);
                cb(total, loaded);
              });
          }, 0);
        });
      },
      /* c8 ignore start */
      abort: () => {
        ctrl.abort();
        clearTimeoutTimer(abortTimer);
      }
    };
  };
}
