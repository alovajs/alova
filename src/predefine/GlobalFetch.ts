import { AlovaRequestAdapterConfig } from '../../typings';
import alovaError from '../utils/alovaError';
import { instanceOf, isString } from '../utils/helper';
import {
  clearTimeoutTimer,
  falseValue,
  JSONStringify,
  len,
  promiseReject,
  promiseThen,
  setTimeoutFn,
  trueValue
} from '../utils/variables';

const isBodyData = (data: any): data is BodyInit => {
  const isTyped = (typed: any) => instanceOf(data, typed);
  return (
    isString(data) ||
    isTyped(FormData) ||
    isTyped(Blob) ||
    isTyped(ArrayBuffer) ||
    isTyped(URLSearchParams) ||
    isTyped(ReadableStream)
  );
};
export default function GlobalFetch() {
  return function (adapterConfig: AlovaRequestAdapterConfig<unknown, unknown, RequestInit, Headers>) {
    // 设置了中断时间，则在指定时间后中断请求
    const timeout = adapterConfig.timeout || 0;
    const ctrl = new AbortController();
    let abortTimer: NodeJS.Timeout;
    let isTimeout = falseValue;
    if (timeout > 0) {
      abortTimer = setTimeoutFn(() => {
        isTimeout = trueValue;
        ctrl.abort();
      }, timeout);
    }

    const data = adapterConfig.data;
    const fetchPromise = fetch(adapterConfig.url, {
      ...adapterConfig,
      signal: ctrl.signal,
      body: isBodyData(data) ? data : JSONStringify(data)
    });

    return {
      response: () =>
        fetchPromise.then(
          response => {
            // 请求成功后清除中断处理
            clearTimeoutTimer(abortTimer);
            return /^[2|3]/.test(response.status.toString())
              ? response
              : promiseReject(alovaError(response.statusText.toString()));
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
          const { headers, body } = response.clone();
          const reader = body?.getReader().read();
          const total = Number(headers.get('Content-Length') || headers.get('content-length') || 0);
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
