import { buildErrorMsg } from '@alova/shared/assert';
import { isSpecialRequestBody, isString, newInstance } from '@alova/shared/function';
import {
  JSONStringify,
  ObjectCls,
  clearTimeoutTimer,
  falseValue,
  promiseReject,
  setTimeoutFn,
  trueValue,
  undefinedValue
} from '@alova/shared/vars';
import { AlovaRequestAdapter } from '~/typings';

type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;
const isBodyData = (data: any): data is BodyInit => isString(data) || isSpecialRequestBody(data);
export default function adapterFetch(): AlovaRequestAdapter<FetchRequestInit, Response, Headers> {
  return (elements, method) => {
    const adapterConfig = method.config;
    const timeout = adapterConfig.timeout || 0;
    const ctrl = new AbortController();
    const { data, headers } = elements;
    const isContentTypeSet = /content-type/i.test(ObjectCls.keys(headers).join());
    const isDataFormData = data && data.toString() === '[object FormData]';

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
    let abortTimer: NodeJS.Timeout | number;
    let isTimeout = falseValue;
    if (timeout > 0) {
      abortTimer = setTimeoutFn(() => {
        isTimeout = trueValue;
        ctrl.abort();
      }, timeout);
    }

    return {
      response: () =>
        fetchPromise.then(
          response => {
            // 请求成功后清除中断处理
            clearTimeoutTimer(abortTimer);

            // Response的Readable只能被读取一次，需要克隆才可重复使用
            return response.clone();
          },
          err => promiseReject(isTimeout ? newInstance(Error, 'fetchError: network timeout') : err)
        ),

      // headers函数内的then需捕获异常，否则会导致内部无法获取到正确的错误对象
      headers: () =>
        fetchPromise.then(
          ({ headers: responseHeaders }) => responseHeaders,
          () => ({}) as Headers
        ),
      // 因nodeFetch库限制，这块代码无法进行单元测试，但已在浏览器中通过测试
      /* c8 ignore start */
      onDownload: async (cb: (loaded: number, total: number) => void) => {
        let isAborted = falseValue;
        const response = await fetchPromise.catch(() => {
          isAborted = trueValue;
        });
        if (!response) return;

        const { headers: responseHeaders, body } = response.clone();
        const reader = body ? body.getReader() : undefinedValue;
        const total = Number(responseHeaders.get('Content-Length') || responseHeaders.get('content-length') || 0);
        if (total <= 0) {
          return;
        }
        let loaded = 0;
        if (reader) {
          const pump = (): Promise<void> =>
            reader.read().then(({ done, value = new Uint8Array() }) => {
              if (done || isAborted) {
                isAborted && cb(total, 0);
              } else {
                loaded += value.byteLength;
                cb(total, loaded);
                return pump();
              }
            });
          pump();
        }
      },
      /* c8 ignore stop */
      abort: () => {
        ctrl.abort();
        clearTimeoutTimer(abortTimer);
      },
      onUpload: () => {
        throw newInstance(
          Error,
          buildErrorMsg(
            '',
            'fetch api does not support uploading. we recommend to use `@alova/adapter-xhr` or `@alova/adapter-axios`'
          )
        );
      }
    };
  };
}
