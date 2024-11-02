import {
  AlovaEventBase,
  ScopedSQCompleteEvent,
  ScopedSQErrorEvent,
  ScopedSQEvent,
  ScopedSQSuccessEvent
} from '@/event';
import {
  PromiseCls,
  createEventManager,
  decorateEvent,
  falseValue,
  getConfig,
  isFn,
  len,
  newInstance,
  objectKeys,
  promiseResolve,
  promiseThen,
  regexpTest,
  sloughConfig,
  trueValue,
  undefinedValue,
  walkObject
} from '@alova/shared';
import { AlovaGenerics, Method } from 'alova';
import {
  AlovaFrontMiddleware,
  AlovaMethodHandler,
  BeforePushQueueHandler,
  FallbackHandler,
  PushedQueueHandler,
  RetryHandler,
  SQHookBehavior,
  SQHookConfig,
  ScopedSQEvents,
  UseHookExposure
} from '~/typings/clienthook';
import { MethodHandler, SilentMethod } from './SilentMethod';
import {
  BEHAVIOR_QUEUE,
  BEHAVIOR_SILENT,
  BEHAVIOR_STATIC,
  DEFAULT_QUEUE_NAME,
  setVDataIdCollectBasket,
  silentAssert,
  vDataIdCollectBasket
} from './globalVariables';
import { pushNewSilentMethod2Queue } from './silentQueue';
import createVirtualResponse from './virtualResponse/createVirtualResponse';
import stringifyVData from './virtualResponse/stringifyVData';
import { regVDataId } from './virtualResponse/variables';

/**
 * A global silentMethod instance that will have a value from before the first success event is triggered to after the last success event is triggered (synchronization period)
 * In this way, the current silentMethod instance can be obtained in updateStateEffect in onSuccess.
 */
export let currentSilentMethod: SilentMethod<any> | undefined = undefinedValue;

/**
 * Create SilentQueue middleware function
 * @param config Configuration object
 * @returns middleware function
 */
export default <AG extends AlovaGenerics, Args extends any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config?: SQHookConfig<AG>
) => {
  const { behavior = 'queue', queue = DEFAULT_QUEUE_NAME, retryError, maxRetryTimes, backoff } = config || {};
  const eventEmitter = createEventManager<ScopedSQEvents<AG>>();
  let handlerArgs: any[] | undefined;
  let behaviorFinally: SQHookBehavior;
  let queueFinally = DEFAULT_QUEUE_NAME;
  let forceRequest = falseValue;
  let silentMethodInstance: SilentMethod<AG>;

  /**
   * method instance creation function
   * @param args Call the function passed in by send
   * @returns method instance
   */
  const createMethod = (...args: any[]) => {
    silentAssert(isFn(handler), 'method handler must be a function. eg. useSQRequest(() => method)');
    setVDataIdCollectBasket({});
    handlerArgs = args;
    return (handler as MethodHandler<AG>)(...args);
  };

  // Decorate success/error/complete event
  const decorateRequestEvent = (requestExposure: UseHookExposure<AG, Args>) => {
    // Set event callback decorator
    requestExposure.onSuccess = decorateEvent(requestExposure.onSuccess, (handler, event) => {
      currentSilentMethod = silentMethodInstance;
      handler(
        newInstance(
          ScopedSQSuccessEvent<AG, Args>,
          behaviorFinally,
          event.method,
          silentMethodInstance,
          event.args,
          event.data
        ) as any
      );
    });

    requestExposure.onError = decorateEvent(requestExposure.onError, (handler, event) => {
      handler(
        newInstance(
          ScopedSQErrorEvent<AG, Args>,
          behaviorFinally,
          event.method,
          silentMethodInstance,
          event.args,
          event.error
        )
      );
    });
    requestExposure.onComplete = decorateEvent(requestExposure.onComplete, (handler, event) => {
      handler(
        newInstance(
          ScopedSQCompleteEvent<AG, Args>,
          behaviorFinally,
          event.method,
          silentMethodInstance,
          event.args,
          event.status,
          event.data,
          event.error
        ) as any
      );
    });
  };

  /**
   * middleware function
   * @param context Request context, containing request-related values
   * @param next continue executing function
   * @returns Promise object
   */
  const middleware: AlovaFrontMiddleware<AG, Args> = ({ method, args, cachedResponse, proxyStates, config }, next) => {
    const { silentDefaultResponse, vDataCaptured, force = falseValue } = config;

    // Because the behavior return value may change, it should be called for each request to re-obtain the return value.
    const baseEvent = AlovaEventBase.spawn(method, args);
    behaviorFinally = sloughConfig(behavior, [baseEvent]);
    queueFinally = sloughConfig(queue, [baseEvent]);
    forceRequest = sloughConfig(force, [baseEvent]);

    // Empty temporary collection variables
    // They need to be cleared before returning
    const resetCollectBasket = () => {
      setVDataIdCollectBasket((handlerArgs = undefinedValue));
    };

    // If v data captured is set, first determine whether the request-related data contains virtual data.
    if (isFn(vDataCaptured)) {
      let hasVData = vDataIdCollectBasket && len(objectKeys(vDataIdCollectBasket)) > 0;
      if (!hasVData) {
        const { url, data } = method;
        const { params, headers } = getConfig(method);
        walkObject({ url, params, data, headers }, value => {
          if (!hasVData && (stringifyVData(value, falseValue) || regexpTest(regVDataId, value))) {
            hasVData = trueValue;
          }
          return value;
        });
      }

      // If v data captured has return data, use it as the response data, otherwise continue the request
      const customResponse = hasVData ? vDataCaptured(method) : undefinedValue;
      if (customResponse !== undefinedValue) {
        resetCollectBasket(); // Reset when captured by v data captured
        return promiseResolve(customResponse);
      }
    }

    if (behaviorFinally !== BEHAVIOR_STATIC) {
      // Wait for the method in the queue to complete execution
      const createSilentMethodPromise = () => {
        const queueResolvePromise = newInstance(PromiseCls, (resolveHandler, rejectHandler) => {
          silentMethodInstance = newInstance(
            SilentMethod<AG>,
            method,
            behaviorFinally,
            eventEmitter,
            undefinedValue,
            !!forceRequest,
            retryError,
            maxRetryTimes,
            backoff,
            resolveHandler,
            rejectHandler,
            handlerArgs,
            vDataIdCollectBasket && objectKeys(vDataIdCollectBasket)
          );
          resetCollectBasket(); // Reset when Behavior is queue and silent
        });

        // On before push and on pushed events are bound synchronously, so they need to be queued asynchronously to trigger the event normally.
        promiseThen(promiseResolve(undefinedValue), async () => {
          const createPushEvent = () =>
            newInstance(ScopedSQEvent<AG, Args>, behaviorFinally, method, silentMethodInstance, args);

          // Put the silent method into the queue and persist it
          const isPushed = await pushNewSilentMethod2Queue(
            silentMethodInstance,
            // After the onFallback event is bound, even the silent behavior mode is no longer stored.
            // onFallback will be called synchronously, so it needs to be determined asynchronously whether there are fallbackHandlers
            len(eventEmitter.eventMap.fallback || []) <= 0 && behaviorFinally === BEHAVIOR_SILENT,
            queueFinally,

            // Execute the callback before putting it into the queue. If false is returned, it will prevent putting it into the queue.
            () => eventEmitter.emit('beforePushQueue', createPushEvent())
          );
          // Only after putting it into the queue, the callback after putting it into the queue will be executed.
          isPushed && eventEmitter.emit('pushedQueue', createPushEvent());
        });

        return queueResolvePromise;
      };

      if (behaviorFinally === BEHAVIOR_QUEUE) {
        // Forced request, or loading status needs to be updated when cache is hit
        const needSendRequest = forceRequest || !cachedResponse;
        if (needSendRequest) {
          // Manually set to true
          proxyStates.loading.v = trueValue;
        }

        // When using the cache, use the cache directly, otherwise enter the request queue
        return needSendRequest ? createSilentMethodPromise() : promiseThen(promiseResolve(cachedResponse));
      }

      const silentMethodPromise = createSilentMethodPromise();
      // Create virtual response data in silent mode. Virtual response data can generate arbitrary virtual data.
      const virtualResponse = (silentMethodInstance.virtualResponse = createVirtualResponse(
        isFn(silentDefaultResponse) ? silentDefaultResponse() : undefinedValue
      ));
      promiseThen<any>(silentMethodPromise, realResponse => {
        // Update after obtaining real data
        proxyStates.data.v = realResponse;
      });

      // In Silent mode, the virtual response value is returned immediately, and then updated when the real data is returned.
      return promiseResolve(virtualResponse);
    }
    resetCollectBasket(); // Reset when Behavior is static
    return next();
  };

  return {
    c: createMethod,
    m: middleware,
    d: decorateRequestEvent,

    // event binding function
    b: {
      /**
       * Bind fallback event
       * @param handler Fallback event callback
       */
      onFallback: (handler: FallbackHandler<AG>) => {
        eventEmitter.on('fallback', handler);
      },

      /**
       * Event before binding to queue
       * @param handler Event callback before enqueuing
       */
      onBeforePushQueue: (handler: BeforePushQueueHandler<AG>) => {
        eventEmitter.on('beforePushQueue', handler);
      },

      /**
       * Event after binding to queue
       * @param handler Event callback after being queued
       */
      onPushedQueue: (handler: PushedQueueHandler<AG>) => {
        eventEmitter.on('pushedQueue', handler);
      },

      /**
       * retry event
       * @param handler Retry event callback
       */
      onRetry: (handler: RetryHandler<AG>) => {
        eventEmitter.on('retry', handler);
      }
    }
  };
};
