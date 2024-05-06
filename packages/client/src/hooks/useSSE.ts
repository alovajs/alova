import { createAssert } from '@alova/shared/assert';
import {
  _self,
  getConfig,
  getMethodInternalKey,
  getOptions,
  instanceOf,
  isFn,
  isPlainObject,
  noop,
  statesHookHelper
} from '@alova/shared/function';
import { falseValue, promiseFinally, promiseThen, trueValue, undefinedValue } from '@alova/shared/vars';
import {
  AlovaMethodHandler,
  Method,
  RespondedHandler,
  RespondedHandlerRecord,
  ResponseCompleteHandler,
  ResponseErrorHandler,
  invalidateCache,
  promiseStatesHook
} from 'alova';
import { getHandlerMethod, throwFn, useCallback, usePromise } from '@/util/helper';
import { buildCompletedURL } from '@/functions/sendRequest';
import createHookEvent, { AlovaHookEventType } from '@/util/createHookEvent';
import {
  AlovaSSEErrorEvent,
  AlovaSSEEvent,
  AlovaSSEMessageEvent,
  SSEHookConfig,
  SSEHookReadyState,
  SSEOn,
  SSEOnErrorTrigger,
  SSEOnMessageTrigger,
  SSEOnOpenTrigger,
  UsePromiseReturnType
} from '~/typings/general';

type AnySSEEventType = AlovaSSEMessageEvent<any, any, any, any, any, any, any, any> &
  AlovaSSEErrorEvent<any, any, any, any, any, any, any> &
  AlovaSSEEvent<any, any, any, any, any, any, any>;

const assert = createAssert('useSSE');
const MessageType: Record<Capitalize<keyof EventSourceEventMap>, keyof EventSourceEventMap> = {
  Open: 'open',
  Error: 'error',
  Message: 'message'
} as const;

export default <
  Data,
  State,
  Computed,
  Watched,
  Export,
  Responded,
  Transformed,
  RequestConfig,
  Response,
  ResponseHeader
>(
  handler:
    | Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
    | AlovaMethodHandler<
        State,
        Computed,
        Watched,
        Export,
        Responded,
        Transformed,
        RequestConfig,
        Response,
        ResponseHeader
      >,
  config: SSEHookConfig = {}
) => {
  const {
    initialData,
    withCredentials,
    interceptByGlobalResponded = trueValue,
    /** abortLast = trueValue, */
    immediate = falseValue
  } = config;
  // ! 暂时不支持指定 abortLast
  const abortLast = trueValue;

  const {
    create,
    ref,
    onMounted,
    onUnmounted,
    memorize,
    exportObject,
    __referingObj: referingObject
  } = statesHookHelper(promiseStatesHook());

  const eventSource = ref<EventSource | undefined>(undefinedValue);
  const sendPromiseObject = ref<UsePromiseReturnType<void> | undefined>(undefinedValue);

  const [data, setData] = create<Data>(initialData, 'data', trueValue);
  const [readyState, setReadyState] = create<SSEHookReadyState>(SSEHookReadyState.CLOSED, 'readyState', trueValue);

  let methodInstance = getHandlerMethod(handler);

  let responseUnified:
    | RespondedHandler<State, Computed, Export, RequestConfig, Response, ResponseHeader>
    | RespondedHandlerRecord<State, Computed, Export, RequestConfig, Response, ResponseHeader>
    | undefined;

  // 储存自定义事件的 useCallback 对象，其中 key 为 eventName
  const customEventMap: Map<string, ReturnType<typeof useCallback>> = new Map();
  const [onOpen, triggerOnOpen, offOpen] =
    useCallback<SSEOnOpenTrigger<State, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>>();
  const [onMessage, triggerOnMessage, offMessage] =
    useCallback<
      SSEOnMessageTrigger<Data, State, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
    >();
  const [onError, triggerOnError, offError] =
    useCallback<SSEOnErrorTrigger<State, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>>();

  let responseSuccessHandler: RespondedHandler<State, Computed, Export, RequestConfig, Response, ResponseHeader> =
    _self;
  let responseErrorHandler: ResponseErrorHandler<State, Computed, Export, RequestConfig, Response, ResponseHeader> =
    throwFn;
  let responseCompleteHandler: ResponseCompleteHandler<
    State,
    Computed,
    Export,
    RequestConfig,
    Response,
    ResponseHeader
  > = noop;

  /**
   * 设置响应拦截器，在每次 send 之后都需要调用
   */
  const setResponseHandler = (instance: Method) => {
    // responsed 从 3.0 开始移除
    const { responded } = getOptions(instance);
    responseUnified = responded;

    if (isFn(responseUnified)) {
      responseSuccessHandler = responseUnified;
    } else if (responseUnified && isPlainObject(responseUnified)) {
      const { onSuccess: successHandler, onError: errorHandler, onComplete: completeHandler } = responseUnified;
      responseSuccessHandler = isFn(successHandler) ? successHandler : responseSuccessHandler;
      responseErrorHandler = isFn(errorHandler) ? errorHandler : responseErrorHandler;
      responseCompleteHandler = isFn(completeHandler) ? completeHandler : responseCompleteHandler;
    }
  };

  /**
   * 处理响应任务，失败时不缓存数据
   * @param handlerReturns 拦截器返回后的数据
   * @returns 处理后的response
   */
  const handleResponseTask = async (handlerReturns: any) => {
    const { headers, name: methodInstanceName, transformData: transformDataFn = _self } = getConfig(methodInstance);
    const methodKey = getMethodInternalKey(methodInstance);

    const returnsData = await handlerReturns;
    const transformedData = await transformDataFn(returnsData, (headers || {}) as ResponseHeader);

    setData(transformedData as any);

    // 查找hitTarget
    const hitMethods = matchSnapshotMethod({
      filter: cachedMethod =>
        (cachedMethod.hitSource || []).some(sourceMatcher =>
          instanceOf(sourceMatcher, RegExp)
            ? sourceMatcher.test(methodInstanceName as string)
            : sourceMatcher === methodInstanceName || sourceMatcher === methodKey
        )
    });

    // 令符合条件(hitTarget定义)的method的缓存失效
    if (hitMethods.length > 0) {
      invalidateCache(hitMethods);
    }

    return transformedData;
  };

  /**
   * 创建 AlovaSSEHook 事件
   * 具体数据处理流程参考以下链接
   * @link https://alova.js.org/zh-CN/tutorial/combine-framework/response
   */
  const createSSEEvent = async (eventFrom: keyof EventSourceEventMap, dataOrError: Promise<any>) => {
    assert(!!eventSource.current, 'EventSource is not initialized');
    const es = eventSource.current!;

    const ev = (type: AlovaHookEventType, data?: any, error?: Error) => {
      const event = createHookEvent(
        type,
        methodInstance,
        undefinedValue,
        undefinedValue,
        undefinedValue,
        undefinedValue,
        undefinedValue,
        undefinedValue,
        data,
        undefinedValue,
        error
      ) as AlovaSSEEvent<State, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>;

      event.eventSource = es;

      return event;
    };

    if (eventFrom === MessageType.Open) {
      return Promise.resolve(ev(AlovaHookEventType.SSEOpenEvent));
    }

    const globalSuccess = interceptByGlobalResponded ? responseSuccessHandler : _self;
    const globalError = interceptByGlobalResponded ? responseErrorHandler : throwFn;
    const globalFinally = interceptByGlobalResponded ? responseCompleteHandler : noop;

    const p = promiseFinally(
      promiseThen(
        dataOrError,
        res => handleResponseTask(globalSuccess(res, methodInstance)),
        error => handleResponseTask(globalError(error, methodInstance))
      ),
      // finally
      () => {
        globalFinally(methodInstance);
      }
    );

    // 无论如何，函数返回的 Promise 对象一定都会 fulfilled
    return promiseThen(
      p,
      // 得到处理好的数据（transform 之后的数据）
      res => ev(AlovaHookEventType.SSEMessageEvent, res),
      // 有错误
      error => ev(AlovaHookEventType.SSEErrorEvent, undefinedValue, error)
    );
  };

  /**
   * 根据事件选择需要的触发函数。如果事件无错误则触发传传入的回调函数
   * @param callback 无错误时触发的回调函数
   */
  const sendSSEEvent = (callback: (event: AnySSEEventType) => any) => (event: AnySSEEventType) => {
    if (event.error === undefinedValue) {
      return callback(event);
    }
    return triggerOnError(event);
  };

  // * MARK: EventSource 的事件处理

  const onCustomEvent: SSEOn<State, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> = memorize(
    (eventName, callbackHandler) => {
      if (!customEventMap.has(eventName)) {
        const useCallbackObject = useCallback<
          (event: AlovaSSEEvent<State, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>) => void
        >(callbacks => {
          if (callbacks.length === 0) {
            eventSource.current?.removeEventListener(eventName, useCallbackObject[1] as any);
            customEventMap.delete(eventName);
          }
        });

        const trigger = useCallbackObject[1];
        customEventMap.set(eventName, useCallbackObject);
        eventSource.current?.addEventListener(eventName, event => {
          promiseThen(createSSEEvent(eventName as any, Promise.resolve(event.data)), sendSSEEvent(trigger) as any);
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [onEvent] = customEventMap.get(eventName)!;

      return onEvent(callbackHandler);
    }
  );

  /**
   * 取消自定义事件在 useCallback 中的注册
   */
  const offCustomEvent = () => {
    customEventMap.forEach(([_1, _2, offTrigger]) => {
      offTrigger();
    });
  };

  const esOpen = () => {
    // resolve 使用 send() 时返回的 promise
    setReadyState(SSEHookReadyState.OPEN);
    promiseThen(createSSEEvent(MessageType.Open, Promise.resolve()), triggerOnOpen as any);
    // ! 一定要在调用 onOpen 之后 resolve
    sendPromiseObject.current?.resolve();
  };

  const esError = (event: Event) => {
    setReadyState(SSEHookReadyState.CLOSED);
    promiseThen(
      createSSEEvent(MessageType.Error, Promise.reject((event as any)?.message ?? 'SSE Error')),
      sendSSEEvent(triggerOnMessage) as any
    );
  };

  const esMessage = (event: MessageEvent<any>) => {
    promiseThen(
      createSSEEvent(MessageType.Message, Promise.resolve(event.data)),
      sendSSEEvent(triggerOnMessage) as any
    );
  };

  /**
   * 关闭当前 eventSource 的注册
   */
  const close = memorize(() => {
    const es = eventSource.current;
    if (!es) {
      return;
    }

    if (sendPromiseObject.current) {
      // 如果 close 时 promise 还在
      sendPromiseObject.current.resolve();
    }

    // * MARK: 解绑事件处理
    es.close();
    es.removeEventListener(MessageType.Open, esOpen);
    es.removeEventListener(MessageType.Error, esError);
    es.removeEventListener(MessageType.Message, esMessage);
    setReadyState(SSEHookReadyState.CLOSED);
    // eventSource 关闭后，取消注册所有自定义事件
    // 否则可能造成内存泄露
    customEventMap.forEach(([_, eventTrigger], eventName) => {
      es.removeEventListener(eventName, eventTrigger);
    });
  });

  /**
   * 发送请求并初始化 eventSource
   */
  const connect = memorize((...sendArgs: any[]) => {
    let es = eventSource.current;
    let promiseObj = sendPromiseObject.current;
    if (es && abortLast) {
      // 当 abortLast === true，关闭之前的连接并重新建立
      close();
    }

    // 设置 send 函数使用的 promise 对象
    if (!promiseObj) {
      promiseObj = sendPromiseObject.current = usePromise();
      // open 后清除 promise 对象
      promiseObj.promise.finally(() => {
        promiseObj = undefinedValue;
      });
    }

    methodInstance = getHandlerMethod(handler, sendArgs);
    // 设置响应拦截器
    setResponseHandler(methodInstance);

    const { params } = getConfig(methodInstance);
    const { baseURL, url } = methodInstance;
    const fullURL = buildCompletedURL(baseURL, url, params);

    // 建立连接
    es = new EventSource(fullURL, { withCredentials });
    eventSource.current = es;
    setReadyState(SSEHookReadyState.CONNECTING);

    // * MARK: 注册处理事件

    // 注册处理事件 open error message
    es.addEventListener(MessageType.Open, esOpen);
    es.addEventListener(MessageType.Error, esError);
    es.addEventListener(MessageType.Message, esMessage);

    // 以及 自定义事件
    // 如果在 connect（send）之前就使用了 on 监听，则 customEventMap 里就已经有事件存在
    customEventMap.forEach(([_, eventTrigger], eventName) => {
      es?.addEventListener(eventName, event => {
        promiseThen(createSSEEvent(eventName as any, Promise.resolve(event.data)), sendSSEEvent(eventTrigger) as any);
      });
    });

    return promiseObj!.promise;
  });

  onUnmounted(() => {
    close();

    // 上面使用 eventSource.removeEventListener 只是断开了 eventSource 和 trigger 的联系
    // 这里是取消 useCallback 对象中的事件注册
    offOpen();
    offMessage();
    offError();
    offCustomEvent();
  });

  // * MARK: 初始化动作
  onMounted(() => {
    if (immediate) {
      connect();
    }
  });

  return {
    send: connect,
    close,
    onMessage,
    onError,
    onOpen,
    on: onCustomEvent,
    ...exportObject({
      readyState,
      data,
      eventSource
    }),
    __referingObj: referingObject
  };
};
