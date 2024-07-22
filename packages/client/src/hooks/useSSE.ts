import { AlovaSSEErrorEvent, AlovaSSEEvent, AlovaSSEMessageEvent } from '@/event';
import { buildCompletedURL } from '@/functions/sendRequest';
import { getHandlerMethod, throwFn, useCallback } from '@/util/helper';
import { createAssert } from '@alova/shared/assert';
import createEventManager from '@alova/shared/createEventManager';
import { AlovaEventBase } from '@alova/shared/event';
import {
  $self,
  getConfig,
  getOptions,
  isFn,
  isPlainObject,
  noop,
  statesHookHelper,
  usePromise
} from '@alova/shared/function';
import { UsePromiseExposure } from '@alova/shared/types';
import { falseValue, promiseFinally, promiseThen, trueValue, undefinedValue } from '@alova/shared/vars';
import {
  AlovaGenerics,
  Method,
  RespondedHandler,
  RespondedHandlerRecord,
  ResponseCompleteHandler,
  ResponseErrorHandler,
  hitCacheBySource,
  promiseStatesHook
} from 'alova';
import { AlovaMethodHandler, SSEHookConfig, SSEHookReadyState, SSEOn } from '~/typings/clienthook';

const SSEOpenEventKey = Symbol('SSEOpen');
const SSEMessageEventKey = Symbol('SSEMessage');
const SSEErrorEventKey = Symbol('SSEError');

export type SSEEvents<Data, AG extends AlovaGenerics> = {
  [SSEOpenEventKey]: AlovaSSEEvent<AG>;
  [SSEMessageEventKey]: AlovaSSEMessageEvent<AG, Data>;
  [SSEErrorEventKey]: AlovaSSEErrorEvent<AG>;
};

type AnySSEEventType<Data, AG extends AlovaGenerics> = AlovaSSEMessageEvent<AG, Data> &
  AlovaSSEErrorEvent<AG> &
  AlovaSSEEvent<AG>;

const assert = createAssert('useSSE');
const MessageType: Record<Capitalize<keyof EventSourceEventMap>, keyof EventSourceEventMap> = {
  Open: 'open',
  Error: 'error',
  Message: 'message'
} as const;

export default <Data = any, AG extends AlovaGenerics = AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
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

  let { memorize } = promiseStatesHook();
  memorize ??= $self;

  const { create, ref, onMounted, onUnmounted, objectify, exposeProvider } = statesHookHelper<AG>(promiseStatesHook());

  const usingargs = ref<any[]>([]);
  const eventSource = ref<EventSource | undefined>(undefinedValue);
  const sendPromiseObject = ref<UsePromiseExposure<void> | undefined>(undefinedValue);

  const data = create(initialData as Data, 'data');
  const readyState = create(SSEHookReadyState.CLOSED, 'readyState');

  let methodInstance = getHandlerMethod(handler);

  let responseUnified: RespondedHandler<AG> | RespondedHandlerRecord<AG> | undefined;

  const eventManager = createEventManager<SSEEvents<Data, AG>>();
  // 储存自定义事件的 useCallback 对象，其中 key 为 eventName
  const customEventMap = ref(new Map<string, ReturnType<typeof useCallback>>());
  const onOpen = (handler: (event: AlovaSSEEvent<AG>) => void) => {
    eventManager.on(SSEOpenEventKey, handler);
  };
  const onMessage = (handler: <Data>(event: AlovaSSEMessageEvent<AG, Data>) => void) => {
    eventManager.on(SSEMessageEventKey, handler);
  };
  const onError = (handler: (event: AlovaSSEErrorEvent<AG>) => void) => {
    eventManager.on(SSEErrorEventKey, handler);
  };

  const responseSuccessHandler = ref<RespondedHandler<AG>>($self);
  const responseErrorHandler = ref<ResponseErrorHandler<AG>>(throwFn);
  const responseCompleteHandler = ref<ResponseCompleteHandler<AG>>(noop);

  /**
   * 设置响应拦截器，在每次 send 之后都需要调用
   */
  const setResponseHandler = (instance: Method) => {
    // responsed 从 3.0 开始移除
    const { responded } = getOptions(instance);
    responseUnified = responded;

    if (isFn(responseUnified)) {
      responseSuccessHandler.current = responseUnified;
    } else if (responseUnified && isPlainObject(responseUnified)) {
      const { onSuccess: successHandler, onError: errorHandler, onComplete: completeHandler } = responseUnified;
      responseSuccessHandler.current = isFn(successHandler) ? successHandler : responseSuccessHandler.current;
      responseErrorHandler.current = isFn(errorHandler) ? errorHandler : responseErrorHandler.current;
      responseCompleteHandler.current = isFn(completeHandler) ? completeHandler : responseCompleteHandler.current;
    }
  };

  /**
   * 处理响应任务，失败时不缓存数据
   * @param handlerReturns 拦截器返回后的数据
   * @returns 处理后的response
   */
  const handleResponseTask = async (handlerReturns: any) => {
    const { headers, transform: transformFn = $self } = getConfig(methodInstance);

    const returnsData = await handlerReturns;
    const transformedData = await transformFn(returnsData, (headers || {}) as AG['ResponseHeader']);

    data.v = transformedData as any;

    // invalidate cache
    hitCacheBySource(methodInstance);

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

    const baseEvent = new AlovaSSEEvent(AlovaEventBase.spawn(methodInstance, usingargs.current), es);

    if (eventFrom === MessageType.Open) {
      return Promise.resolve(baseEvent);
    }

    const globalSuccess = interceptByGlobalResponded ? responseSuccessHandler.current : $self;
    const globalError = interceptByGlobalResponded ? responseErrorHandler.current : throwFn;
    const globalFinally = interceptByGlobalResponded ? responseCompleteHandler.current : noop;

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
      res => new AlovaSSEMessageEvent(baseEvent, res),
      // 有错误
      error => new AlovaSSEErrorEvent(baseEvent, error)
    );
  };

  /**
   * 根据事件选择需要的触发函数。如果事件无错误则触发传传入的回调函数
   * @param callback 无错误时触发的回调函数
   */
  const sendSSEEvent = (callback: (event: AnySSEEventType<Data, AG>) => any) => (event: AnySSEEventType<Data, AG>) => {
    if (event.error === undefinedValue) {
      return callback(event);
    }
    return eventManager.emit(SSEErrorEventKey, event);
  };

  // * MARK: EventSource 的事件处理

  const onCustomEvent: SSEOn<AG> = (eventName, callbackHandler) => {
    const currentMap = customEventMap.current;
    if (!currentMap.has(eventName)) {
      const useCallbackObject = useCallback<(event: AlovaSSEEvent<AG>) => void>(callbacks => {
        if (callbacks.length === 0) {
          eventSource.current?.removeEventListener(eventName, useCallbackObject[1] as any);
          customEventMap.current.delete(eventName);
        }
      });

      const trigger = useCallbackObject[1];
      currentMap.set(eventName, useCallbackObject);
      eventSource.current?.addEventListener(eventName, event => {
        promiseThen(createSSEEvent(eventName as any, Promise.resolve(event.data)), sendSSEEvent(trigger) as any);
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [onEvent] = currentMap.get(eventName)!;

    return onEvent(callbackHandler);
  };
  /**
   * 取消自定义事件在 useCallback 中的注册
   */
  const offCustomEvent = () => {
    customEventMap.current.forEach(([_1, _2, offTrigger]) => {
      offTrigger();
    });
  };

  const esOpen = memorize(() => {
    // resolve 使用 send() 时返回的 promise
    readyState.v = SSEHookReadyState.OPEN;
    promiseThen(createSSEEvent(MessageType.Open, Promise.resolve()), event =>
      eventManager.emit(SSEOpenEventKey, event)
    );
    // ! 一定要在调用 onOpen 之后 resolve
    sendPromiseObject.current?.resolve();
  });

  const esError = memorize((event: Event) => {
    readyState.v = SSEHookReadyState.CLOSED;
    promiseThen(
      createSSEEvent(MessageType.Error, Promise.reject((event as any)?.message ?? 'SSE Error')),
      sendSSEEvent(event => eventManager.emit(SSEMessageEventKey, event)) as any
    );
    sendPromiseObject.current?.resolve();
  });

  const esMessage = memorize((event: MessageEvent<any>) => {
    promiseThen(
      createSSEEvent(MessageType.Message, Promise.resolve(event.data)),
      sendSSEEvent(event => eventManager.emit(SSEMessageEventKey, event)) as any
    );
  });

  /**
   * 关闭当前 eventSource 的注册
   */
  const close = () => {
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
    readyState.v = SSEHookReadyState.CLOSED;
    // eventSource 关闭后，取消注册所有自定义事件
    // 否则可能造成内存泄露
    customEventMap.current.forEach(([_, eventTrigger], eventName) => {
      es.removeEventListener(eventName, eventTrigger);
    });
  };

  /**
   * 发送请求并初始化 eventSource
   */
  const connect = (...args: any[]) => {
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
      promiseObj &&
        promiseObj.promise.finally(() => {
          promiseObj = undefinedValue;
        });
    }

    usingargs.current = args;
    methodInstance = getHandlerMethod(handler, args);
    // 设置响应拦截器
    setResponseHandler(methodInstance);

    const { params } = getConfig(methodInstance);
    const { baseURL, url } = methodInstance;
    const fullURL = buildCompletedURL(baseURL, url, params);

    // 建立连接
    es = new EventSource(fullURL, { withCredentials });
    eventSource.current = es;
    readyState.v = SSEHookReadyState.CONNECTING;
    // * MARK: 注册处理事件

    // 注册处理事件 open error message
    es.addEventListener(MessageType.Open, esOpen);
    es.addEventListener(MessageType.Error, esError);
    es.addEventListener(MessageType.Message, esMessage);

    // 以及 自定义事件
    // 如果在 connect（send）之前就使用了 on 监听，则 customEventMap 里就已经有事件存在
    customEventMap.current.forEach(([_, eventTrigger], eventName) => {
      es?.addEventListener(eventName, event => {
        promiseThen(createSSEEvent(eventName as any, Promise.resolve(event.data)), sendSSEEvent(eventTrigger) as any);
      });
    });

    return promiseObj!.promise;
  };

  onUnmounted(() => {
    close();

    // 上面使用 eventSource.removeEventListener 只是断开了 eventSource 和 trigger 的联系
    // 这里是取消 useCallback 对象中的事件注册
    eventManager.off(SSEOpenEventKey);
    eventManager.off(SSEMessageEventKey);
    eventManager.off(SSEErrorEventKey);
    offCustomEvent();
  });

  // * MARK: 初始化动作
  onMounted(() => {
    if (immediate) {
      connect();
      sendPromiseObject.current?.promise.catch(() => {});
    }
  });

  return exposeProvider({
    send: connect,
    close,
    on: onCustomEvent,
    onMessage,
    onError,
    onOpen,
    eventSource,
    ...objectify([readyState, data])
  });
};
