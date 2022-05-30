import { RequestConfig } from '../../typings';
import alovaError from '../utils/alovaError';
import { JSONStringify, noop, promiseReject } from '../utils/helper';

type RequestInit = NonNullable<Parameters<typeof fetch>[1]>;
const isBodyData = (data: any) => {
  const isTyped = (typed: any) => data instanceof typed;
  return isTyped(FormData) || isTyped(Blob) || isTyped(ArrayBuffer) || isTyped(URLSearchParams) || isTyped(ReadableStream);
}
export default function GlobalFetch(requestInit: RequestInit = {}) {
  return function<R, T>(source: string, data: any, config: RequestConfig<R, T>) {
    
    // 设置了中断时间，则在指定时间后中断请求
    const timeout = config.timeout || 0;
    const ctrl = new AbortController();
    let abortTimer: NodeJS.Timeout;
    let isTimeout = false;
    if (timeout > 0) {
      abortTimer = setTimeout(() => {
        isTimeout = true;
        ctrl.abort();
      }, timeout);
    }

    const fetchPromise = window.fetch(source, {
      ...requestInit,
      ...config,
      signal: ctrl.signal,
      body: isBodyData(data) ? data : JSONStringify(data),
    });
    
    const clearTimeoutTimer = () => clearTimeout(abortTimer);
    return {
      response: () => fetchPromise.then(response => {
        // 请求成功后清除中断处理
        clearTimeoutTimer();
        return /^[2|3]/.test(response.status.toString()) ? response : promiseReject(alovaError(response.statusText));
      }, err => promiseReject(
        alovaError(isTimeout ? 'fetchError: network timeout' : err.message)
      )),

      // headers函数内的then需捕获异常，否则会导致内部无法获取到正确的错误对象
      headers: () => fetchPromise.then(({ headers }) => headers, noop),
      progress: (cb: (value: number) => void) => {
        fetchPromise.then(response => {
          const contentLength = Number(response.headers.get('Content-Length')) || 1;
          let receivedLength = 0;
          let progressTimer = setInterval(() => {
            response.body?.getReader().read().then(({done, value = new Uint8Array()}) => {
              if (done) {
                clearInterval(progressTimer);
              }
              receivedLength += value.length;
              const percent = (receivedLength / contentLength).toFixed(4);
              cb(Number(percent));
            });
          }, 100);
        });
      },
      abort: () => {
        ctrl.abort();
        clearTimeoutTimer();
      },
    };
  };
}