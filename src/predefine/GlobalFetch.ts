import { AlovaRequestAdapterConfig, Progress } from '../../typings';
import alovaError from '../utils/alovaError';
import { isString, noop } from '../utils/helper';
import { clearTimeoutTimer, falseValue, JSONStringify, promiseReject, setTimeoutFn, trueValue } from '../utils/variables';


const isBodyData = (data: any): data is BodyInit => {
  const isTyped = (typed: any) => data instanceof typed;
  return isString(data) || isTyped(FormData) || isTyped(Blob) || isTyped(ArrayBuffer) || isTyped(URLSearchParams) || isTyped(ReadableStream);
}
export default function GlobalFetch(defaultRequestInit: RequestInit = {}) {
  return function<R, T>(adapterConfig: AlovaRequestAdapterConfig<R, T, RequestInit>) {
    // 设置了中断时间，则在指定时间后中断请求
    const timeout = adapterConfig.timeout || 0;
    const ctrl = new AbortController();
    let abortTimer: number;
    let isTimeout = falseValue;
    if (timeout > 0) {
      abortTimer = setTimeoutFn(() => {
        isTimeout = trueValue;
        ctrl.abort();
      }, timeout);
    }

    const data = adapterConfig.data;
    const fetchPromise = fetch(adapterConfig.url, {
      ...defaultRequestInit,
      ...adapterConfig,
      signal: ctrl.signal,
      body: isBodyData(data) ? data : JSONStringify(data),
    });
    
    return {
      response: () => fetchPromise.then(response => {
        // 请求成功后清除中断处理
        clearTimeoutTimer(abortTimer);
        return /^[2|3]/.test(response.status.toString()) ? response : promiseReject(alovaError(response.statusText));
      }, err => promiseReject(
        alovaError(isTimeout ? 'fetchError: network timeout' : err.message)
      )),

      // headers函数内的then需捕获异常，否则会导致内部无法获取到正确的错误对象
      headers: () => fetchPromise.then(({ headers }) => headers, noop),
      onDownload: (cb: (progress: Progress) => void) => {
        fetchPromise.then(response => {
          const { headers, body } = response;
          const total = Number(headers.get('Content-Length') || headers.get('content-length') || 0);
          if (total <= 0) {
            return;
          }
          let loaded = 0;
          let progressTimer = setInterval(() => {
            body?.getReader().read().then(({ done, value = new Uint8Array() }) => {
              if (done) {
                clearInterval(progressTimer);
              }
              loaded += value.length;
              cb({ total, loaded });
            });
          }, 100);
        });
      },
      abort: () => {
        ctrl.abort();
        clearTimeoutTimer(abortTimer);
      },
    };

  };
}