import { MethodConfig } from '../../typings';
import { RequestBody } from '../Alova';

type RequestInit = NonNullable<Parameters<typeof fetch>[1]>;
export default function GlobalFetch(requestInit: RequestInit = {}) {
  return function<R, T>(source: string, data: RequestBody, config: RequestInit, options: MethodConfig<R, T> = {}) {
    // 设置了中断时间，则在指定时间后中断请求
    const timeout = options.timeout || 0;
    const ctrl = new AbortController();
    let timer: NodeJS.Timeout;
    if (timeout > 0) {
      timer = setTimeout(ctrl.abort, timeout);
    }
    const fetchPromise = fetch(source, {
      ...requestInit,
      ...config,
      signal: ctrl.signal,
      body: data instanceof FormData ? data : JSON.stringify(data),
    });

    return {
      response: () => fetchPromise,
      progress: () => fetchPromise
        .then(response => response.body?.getReader().read())
        .then(res => res?.value?.length || 0),
      abort: () => ctrl.abort(),
    };
  };
}