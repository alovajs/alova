import { ScopedSQCompleteEvent, ScopedSQErrorEvent, ScopedSQEvent, ScopedSQSuccessEvent } from '@/event';
import createEventManager, { decorateEvent } from '@alova/shared/createEventManager';
import { AlovaEventBase } from '@alova/shared/event';
import { getConfig, isFn, newInstance, sloughConfig, walkObject } from '@alova/shared/function';
import {
  PromiseCls,
  falseValue,
  len,
  objectKeys,
  promiseResolve,
  promiseThen,
  regexpTest,
  trueValue,
  undefinedValue
} from '@alova/shared/vars';
import { AlovaGenerics, Method } from 'alova';
import { AlovaFrontMiddleware, AlovaMethodHandler, UseHookExposure } from '~/typings';
import {
  BeforePushQueueHandler,
  FallbackHandler,
  PushedQueueHandler,
  RetryHandler,
  SQHookBehavior,
  SQHookConfig,
  ScopedSQEvents
} from '~/typings/general';
import { MethodHandler, SilentMethod } from './SilentMethod';
import {
  BEHAVIOR_QUEUE,
  BEHAVIOR_SILENT,
  BEHAVIOR_STATIC,
  DEFAUT_QUEUE_NAME,
  setVDataIdCollectBasket,
  silentAssert,
  vDataIdCollectBasket
} from './globalVariables';
import { pushNewSilentMethod2Queue } from './silentQueue';
import createVirtualResponse from './virtualResponse/createVirtualResponse';
import stringifyVData from './virtualResponse/stringifyVData';
import { regVDataId } from './virtualResponse/variables';

/**
 * 全局的silentMethod实例，它将在第一个成功事件触发前到最后一个成功事件触发后有值（同步时段）
 * 通过此方式让onSuccess中的updateStateEffect内获得当前的silentMethod实例
 */
export let currentSilentMethod: SilentMethod<any> | undefined = undefinedValue;

/**
 * 创建SilentQueue中间件函数
 * @param config 配置对象
 * @returns 中间件函数
 */
export default <AG extends AlovaGenerics>(handler: Method<AG> | AlovaMethodHandler<AG>, config?: SQHookConfig<AG>) => {
  const { behavior = 'queue', queue = DEFAUT_QUEUE_NAME, retryError, maxRetryTimes, backoff } = config || {};
  const eventEmitter = createEventManager<ScopedSQEvents<AG>>();
  let handlerArgs: any[] | undefined;
  let behaviorFinally: SQHookBehavior;
  let queueFinally = DEFAUT_QUEUE_NAME;
  let forceRequest = falseValue;
  let silentMethodInstance: SilentMethod<AG>;

  /**
   * method实例创建函数
   * @param args 调用send传入的函数
   * @returns method实例
   */
  const createMethod = (...args: any[]) => {
    silentAssert(isFn(handler), 'method handler must be a function. eg. useSQRequest(() => method)');
    setVDataIdCollectBasket({});
    handlerArgs = args;
    return (handler as MethodHandler<AG>)(...args);
  };

  // 装饰success/error/complete事件
  const decorateRequestEvent = (requestExposure: UseHookExposure<AG>) => {
    // 设置事件回调装饰器
    requestExposure.onSuccess = decorateEvent(requestExposure.onSuccess, (handler, event) => {
      currentSilentMethod = silentMethodInstance;
      handler(
        newInstance(
          ScopedSQSuccessEvent<AG>,
          behaviorFinally,
          event.method,
          silentMethodInstance,
          event.sendArgs,
          event.data
        ) as any
      );
    });

    requestExposure.onError = decorateEvent(requestExposure.onError, (handler, event) => {
      handler(
        newInstance(
          ScopedSQErrorEvent<AG>,
          behaviorFinally,
          event.method,
          silentMethodInstance,
          event.sendArgs,
          event.error
        ) as any
      );
    });
    requestExposure.onComplete = decorateEvent(requestExposure.onComplete, (handler, event) => {
      handler(
        newInstance(
          ScopedSQCompleteEvent<AG>,
          behaviorFinally,
          event.method,
          silentMethodInstance,
          event.sendArgs,
          event.status,
          event.data,
          event.error
        ) as any
      );
    });
  };

  /**
   * 中间件函数
   * @param context 请求上下文，包含请求相关的值
   * @param next 继续执行函数
   * @returns Promise对象
   */
  const middleware: AlovaFrontMiddleware<AG> = ({ method, args, cachedResponse, proxyStates, config }, next) => {
    const { silentDefaultResponse, vDataCaptured, force = falseValue } = config;

    // 因为behavior返回值可能会变化，因此每次请求都应该调用它重新获取返回值
    const baseEvent = AlovaEventBase.spawn(method, args);
    behaviorFinally = sloughConfig(behavior, [baseEvent]);
    queueFinally = sloughConfig(queue, [baseEvent]);
    forceRequest = sloughConfig(force, [baseEvent]);

    // 置空临时收集变量
    // 返回前都需要置空它们
    const resetCollectBasket = () => {
      setVDataIdCollectBasket((handlerArgs = undefinedValue));
    };

    // 如果设置了vDataCaptured，则先判断请求相关的数据是否包含虚拟数据
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

      // 如果vDataCaptured有返回数据，则使用它作为响应数据，否则继续请求
      const customResponse = hasVData ? vDataCaptured(method) : undefinedValue;
      if (customResponse !== undefinedValue) {
        resetCollectBasket(); // 被vDataCaptured捕获时的重置
        return promiseResolve(customResponse);
      }
    }

    if (behaviorFinally !== BEHAVIOR_STATIC) {
      // 等待队列中的method执行完毕
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
          resetCollectBasket(); // behavior为queue和silent时的重置
        });

        // onBeforePush和onPushed事件是同步绑定的，因此需要异步执行入队列才能正常触发事件
        promiseThen(promiseResolve(undefinedValue), async () => {
          const createPushEvent = () =>
            newInstance(ScopedSQEvent<AG>, behaviorFinally, method, silentMethodInstance, args);

          // 将silentMethod放入队列并持久化
          const isPushed = await pushNewSilentMethod2Queue(
            silentMethodInstance,
            // onFallback绑定了事件后，即使是silent行为模式也不再存储
            // onFallback会同步调用，因此需要异步判断是否存在fallbackHandlers
            len(eventEmitter.eventMap.fallback || []) <= 0 && behaviorFinally === BEHAVIOR_SILENT,
            queueFinally,

            // 执行放入队列前回调，如果返回false则阻止放入队列
            () => eventEmitter.emit('beforePushQueue', createPushEvent())
          );
          // 只有在放入队列后，才执行放入队列后的回调
          isPushed && eventEmitter.emit('pushedQueue', createPushEvent());
        });

        return queueResolvePromise;
      };

      if (behaviorFinally === BEHAVIOR_QUEUE) {
        // 强制请求，或命中缓存时需要更新loading状态
        const needSendRequest = forceRequest || !cachedResponse;
        if (needSendRequest) {
          // 手动设置为true
          proxyStates.loading.v = trueValue;
        }

        // 当使用缓存时，直接使用缓存，否则再进入请求队列
        return needSendRequest ? createSilentMethodPromise() : promiseThen(promiseResolve(cachedResponse));
      }

      const silentMethodPromise = createSilentMethodPromise();
      // 在silent模式下创建虚拟响应数据，虚拟响应数据可生成任意的虚拟数据
      const virtualResponse = (silentMethodInstance.virtualResponse = createVirtualResponse(
        isFn(silentDefaultResponse) ? silentDefaultResponse() : undefinedValue
      ));
      promiseThen<any>(silentMethodPromise, realResponse => {
        // 获取到真实数据后更新过去
        proxyStates.data.v = realResponse;
      });

      // silent模式下，先立即返回虚拟响应值，然后当真实数据返回时再更新
      return promiseResolve(virtualResponse);
    }
    resetCollectBasket(); // behavior为static时的重置
    return next();
  };

  return {
    c: createMethod,
    m: middleware,
    d: decorateRequestEvent,

    // 事件绑定函数
    b: {
      /**
       * 绑定回退事件
       * @param handler 回退事件回调
       */
      onFallback: (handler: FallbackHandler<AG>) => {
        eventEmitter.on('fallback', handler);
      },

      /**
       * 绑定入队列前事件
       * @param handler 入队列前的事件回调
       */
      onBeforePushQueue: (handler: BeforePushQueueHandler<AG>) => {
        eventEmitter.on('beforePushQueue', handler);
      },

      /**
       * 绑定入队列后事件
       * @param handler 入队列后的事件回调
       */
      onPushedQueue: (handler: PushedQueueHandler<AG>) => {
        eventEmitter.on('pushedQueue', handler);
      },

      /**
       * 重试事件
       * @param handler 重试事件回调
       */
      onRetry: (handler: RetryHandler<AG>) => {
        eventEmitter.on('retry', handler);
      }
    }
  };
};
