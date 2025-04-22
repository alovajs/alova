import { AlovaEventBase, AlovaSSEErrorEvent, AlovaSSEEvent, AlovaSSEMessageEvent } from '@/event';
import { getHandlerMethod, statesHookHelper, throwFn, useCallback } from '@/util/helper';
import {
  $self,
  UsePromiseExposure,
  buildCompletedURL,
  createAssert,
  createEventManager,
  falseValue,
  getConfig,
  getOptions,
  isFn,
  isPlainObject,
  noop,
  promiseFinally,
  promiseThen,
  trueValue,
  undefinedValue,
  usePromise
} from '@alova/shared';
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
import { AlovaMethodHandler, SSEHookConfig } from '~/typings/clienthook';

const SSEOpenEventKey = Symbol('SSEOpen');
const SSEMessageEventKey = Symbol('SSEMessage');
const SSEErrorEventKey = Symbol('SSEError');
export const enum SSEHookReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSED = 2
}

export type SSEEvents<Data, AG extends AlovaGenerics, Args extends any[]> = {
  [SSEOpenEventKey]: AlovaSSEEvent<AG, Args>;
  [SSEMessageEventKey]: AlovaSSEMessageEvent<Data, AG, Args>;
  [SSEErrorEventKey]: AlovaSSEErrorEvent<AG, Args>;
};

type AnySSEEventType<Data, AG extends AlovaGenerics, Args extends any[]> = AlovaSSEMessageEvent<Data, AG, Args> &
  AlovaSSEErrorEvent<AG, Args> &
  AlovaSSEEvent<AG, Args>;

const assert = createAssert('useSSE');
const MessageType: Record<Capitalize<keyof EventSourceEventMap>, keyof EventSourceEventMap> = {
  Open: 'open',
  Error: 'error',
  Message: 'message'
} as const;

export default <Data = any, AG extends AlovaGenerics = AlovaGenerics, Args extends any[] = any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config: SSEHookConfig = {}
) => {
  const {
    initialData,
    withCredentials,
    interceptByGlobalResponded = trueValue,
    /** abortLast = trueValue, */
    immediate = falseValue
  } = config;
  // ! Temporarily does not support specifying abortLast
  const abortLast = trueValue;

  let { memorize } = promiseStatesHook();
  memorize ??= $self;

  const { create, ref, onMounted, onUnmounted, objectify, exposeProvider } = statesHookHelper<AG>(promiseStatesHook());

  const usingArgs = ref<[...Args, ...any[]]>([] as any);
  const eventSource = ref<EventSource | undefined>(undefinedValue);
  const sendPromiseObject = ref<UsePromiseExposure<void> | undefined>(undefinedValue);

  const data = create(initialData as Data, 'data');
  const readyState = create(SSEHookReadyState.CLOSED, 'readyState');

  let methodInstance = getHandlerMethod(handler);

  let responseUnified: RespondedHandler<AG> | RespondedHandlerRecord<AG> | undefined;

  const eventManager = createEventManager<SSEEvents<Data, AG, Args>>();
  // UseCallback object that stores custom events, where key is eventName
  const customEventMap = ref(new Map<string, ReturnType<typeof useCallback>>());
  const onOpen = (handler: (event: AlovaSSEEvent<AG, Args>) => void) => {
    eventManager.on(SSEOpenEventKey, handler);
  };
  const onMessage = (handler: <Data>(event: AlovaSSEMessageEvent<Data, AG, Args>) => void) => {
    eventManager.on(SSEMessageEventKey, handler);
  };
  const onError = (handler: (event: AlovaSSEErrorEvent<AG, Args>) => void) => {
    eventManager.on(SSEErrorEventKey, handler);
  };

  const responseSuccessHandler = ref<RespondedHandler<AG>>($self);
  const responseErrorHandler = ref<ResponseErrorHandler<AG>>(throwFn);
  const responseCompleteHandler = ref<ResponseCompleteHandler<AG>>(noop);

  /**
   * Set up a response interceptor, which needs to be called after each send
   */
  const setResponseHandler = (instance: Method) => {
    // responded removed since 3.0
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
   * Process response tasks and do not cache data on failure
   * @param handlerReturns Data returned by the interceptor
   * @returns Processed response
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
   * Create AlovaSSEHook event
   * For specific data processing procedures, please refer to the following link
   * @link https://alova.js.org/zh-CN/tutorial/combine-framework/response
   */
  const createSSEEvent = async (eventFrom: keyof EventSourceEventMap, dataOrError: Promise<any>) => {
    assert(!!eventSource.current, 'EventSource is not initialized');
    const es = eventSource.current!;

    const baseEvent = new AlovaSSEEvent<AG, Args>(
      AlovaEventBase.spawn<AG, Args>(methodInstance, usingArgs.current),
      es
    );

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
      // Finally
      () => {
        globalFinally(methodInstance);
      }
    );

    // Regardless, the Promise object returned by the function must be fulfilled
    return promiseThen(
      p,
      // Get processed data (data after transform)
      res => new AlovaSSEMessageEvent<AG, any, Args>(baseEvent, res),
      // There is an error
      error => new AlovaSSEErrorEvent(baseEvent, error)
    );
  };

  /**
   * Select the required trigger function based on the event. If the event has no errors, the callback function passed in is triggered.
   * @param callback Callback function triggered when there is no error
   */
  const sendSSEEvent =
    (callback: (event: AnySSEEventType<Data, AG, Args>) => any) => (event: AnySSEEventType<Data, AG, Args>) => {
      if (event.error === undefinedValue) {
        return callback(event);
      }
      return eventManager.emit(SSEErrorEventKey, event);
    };

  // * MARK: Event handling of EventSource

  const onCustomEvent = <T = AG['Responded']>(
    eventName: string,
    callbackHandler: (event: AlovaSSEMessageEvent<T, AG, Args>) => void
  ) => {
    const currentMap = customEventMap.current;
    if (!currentMap.has(eventName)) {
      const useCallbackObject = useCallback<(event: AlovaSSEEvent<AG, Args>) => void>(callbacks => {
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

    const [onEvent] = currentMap.get(eventName)!;

    return onEvent(callbackHandler);
  };
  /**
   * Cancel the registration of custom events in useCallback
   */
  const offCustomEvent = () => {
    customEventMap.current.forEach(([_1, _2, offTrigger]) => {
      offTrigger();
    });
  };

  const esOpen = memorize(() => {
    // resolve the promise returned when using send()
    readyState.v = SSEHookReadyState.OPEN;
    promiseThen(createSSEEvent(MessageType.Open, Promise.resolve()), event =>
      eventManager.emit(SSEOpenEventKey, event)
    );
    // ! Must be resolved after calling onOpen
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
   * Close the registration of the current eventSource
   */
  const close = () => {
    const es = eventSource.current;
    if (!es) {
      return;
    }

    if (sendPromiseObject.current) {
      // If the promise is still there when close
      sendPromiseObject.current.resolve();
    }

    // * MARK: Unbinding event handling
    es.close();
    es.removeEventListener(MessageType.Open, esOpen);
    es.removeEventListener(MessageType.Error, esError);
    es.removeEventListener(MessageType.Message, esMessage);
    readyState.v = SSEHookReadyState.CLOSED;
    // After eventSource is closed, unregister all custom events
    // Otherwise it may cause memory leaks
    customEventMap.current.forEach(([_, eventTrigger], eventName) => {
      es.removeEventListener(eventName, eventTrigger);
    });
  };

  /**
   * Send request and initialize eventSource
   */
  const connect = (...args: [...Args, ...any[]]) => {
    let es = eventSource.current;
    let promiseObj = sendPromiseObject.current;
    if (es && abortLast) {
      // When abortLast === true, close the previous connection and re-establish it
      close();
    }

    // Set the promise object used by the send function
    if (!promiseObj) {
      promiseObj = sendPromiseObject.current = usePromise();
      // Clear the promise object after open
      promiseObj &&
        promiseObj.promise.finally(() => {
          promiseObj = undefinedValue;
        });
    }

    usingArgs.current = args;
    methodInstance = getHandlerMethod(handler, args);
    // Set up response interceptor
    setResponseHandler(methodInstance);

    const { params } = getConfig(methodInstance);
    const { baseURL, url } = methodInstance;
    const fullURL = buildCompletedURL(baseURL, url, params);

    // Establish connection
    es = new EventSource(fullURL, { withCredentials });
    eventSource.current = es;
    readyState.v = SSEHookReadyState.CONNECTING;
    // * MARK: Register to handle events

    // Register to handle event open error message
    es.addEventListener(MessageType.Open, esOpen);
    es.addEventListener(MessageType.Error, esError);
    es.addEventListener(MessageType.Message, esMessage);

    // and custom events
    // If the on listener is used before connect (send), there will already be events in customEventMap.
    customEventMap.current.forEach(([_, eventTrigger], eventName) => {
      es?.addEventListener(eventName, event => {
        promiseThen(createSSEEvent(eventName as any, Promise.resolve(event.data)), sendSSEEvent(eventTrigger) as any);
      });
    });

    return promiseObj!.promise;
  };

  onUnmounted(() => {
    close();

    // The above use of eventSource.removeEventListener just disconnects eventSource and trigger.
    // Here is the cancellation of the event registration in the useCallback object
    eventManager.off(SSEOpenEventKey);
    eventManager.off(SSEMessageEventKey);
    eventManager.off(SSEErrorEventKey);
    offCustomEvent();
  });

  // * MARK: initialization action
  onMounted(() => {
    if (immediate) {
      connect(...([] as unknown as [...Args, ...any[]]));
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
