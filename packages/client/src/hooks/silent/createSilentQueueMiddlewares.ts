import createHookEvent from '@/util/createHookEvent';
import createEventManager from '@alova/shared/createEventManager';
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
import { AlovaFrontMiddleware, AlovaMethodHandler } from '~/typings';
import {
  BeforePushQueueHandler,
  FallbackHandler,
  PushedQueueHandler,
  RetryHandler,
  SQHookConfig,
  ScopedSQEvent,
  ScopedSQRetryEvent
} from '~/typings/general';
import { MethodHandler, SilentMethod } from './SilentMethod';
import {
  BEHAVIOR_QUEUE,
  BEHAVIOR_SILENT,
  BEHAVIOR_STATIC,
  setVDataIdCollectBasket,
  silentAssert,
  vDataIdCollectBasket
} from './globalVariables';
import { pushNewSilentMethod2Queue } from './silentQueue';
import createVirtualResponse from './virtualResponse/createVirtualResponse';
import stringifyVData from './virtualResponse/stringifyVData';
import { regVDataId } from './virtualResponse/variables';

const FallbackEventKey = Symbol('SQFallback');
const RetryEventKey = Symbol('SQRetry');
const BeforePushQueueEventKey = Symbol('SQBeforePushQueue');
const PushedQueueEventKey = Symbol('SQPushedQueue');

export type SQEvents<AG extends AlovaGenerics> = {
  [FallbackEventKey]: ScopedSQEvent<AG>;
  [RetryEventKey]: ScopedSQRetryEvent<AG>;
  [BeforePushQueueEventKey]: ScopedSQEvent<AG>;
  [PushedQueueEventKey]: ScopedSQEvent<AG>;
};

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
  const { behavior = 'queue', queue, retryError, maxRetryTimes, backoff } = config || {};
  const eventManager = createEventManager<SQEvents<AG>>();
  const retryHandlers: RetryHandler<AG>[] = [];
  let handlerArgs: any[] | undefined;

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

  /**
   * 中间件函数
   * @param context 请求上下文，包含请求相关的值
   * @param next 继续执行函数
   * @returns {Promise}
   */
  const middleware: AlovaFrontMiddleware<AG> = (
    { method, args, cachedResponse, proxyStates, decorateSuccess, decorateError, decorateComplete, config },
    next
  ) => {
    const { silentDefaultResponse, vDataCaptured, force = falseValue } = config;

    // 因为behavior返回值可能会变化，因此每次请求都应该调用它重新获取返回值
    const behaviorFinally = sloughConfig(behavior, args);
    const queueFinally = sloughConfig(queue, args);
    const forceRequest = sloughConfig(force, args);
    let silentMethodInstance: any;

    // 设置事件回调装饰器
    decorateSuccess((handler, event, index, length) => {
      if (index === 0) {
        currentSilentMethod = silentMethodInstance;
      }
      handler(
        createHookEvent(
          5,
          method,
          behaviorFinally,
          silentMethodInstance,
          undefinedValue,
          undefinedValue,
          undefinedValue,
          event.sendArgs,
          event.data
        ) as any
      );

      // 所有成功回调执行完后再锁定虚拟数据，锁定后虚拟响应数据内不能再访问任意层级
      // 锁定操作只在silent模式下，用于锁定虚拟数据的生成操作
      if (index === length - 1) {
        currentSilentMethod = undefinedValue;
      }
    });
    decorateError((handler, event) => {
      handler(
        createHookEvent(
          6,
          method,
          behaviorFinally,
          silentMethodInstance,
          undefinedValue,
          undefinedValue,
          undefinedValue,
          event.sendArgs,
          undefinedValue,
          undefinedValue,
          event.error
        ) as any
      );
    });
    decorateComplete((handler, event) => {
      handler(
        createHookEvent(
          7,
          method,
          behaviorFinally,
          silentMethodInstance,
          undefinedValue,
          undefinedValue,
          undefinedValue,
          event.sendArgs,
          event.data,
          undefinedValue,
          event.error,
          event.status
        ) as any
      );
    });

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
            method as Method,
            behaviorFinally,
            undefinedValue,
            !!forceRequest,
            retryError,
            maxRetryTimes,
            backoff,
            eventManager.eventMap[FallbackEventKey],
            resolveHandler,
            rejectHandler,
            handlerArgs,
            vDataIdCollectBasket && objectKeys(vDataIdCollectBasket),
            retryHandlers as any[]
          );
          resetCollectBasket(); // behavior为queue和silent时的重置
        });

        // onBeforePush和onPushed事件是同步绑定的，因此需要异步执行入队列才能正常触发事件
        promiseThen(promiseResolve(undefinedValue), () => {
          const createPushEvent = () =>
            createHookEvent(
              4,
              method,
              behaviorFinally,
              silentMethodInstance,
              undefinedValue,
              undefinedValue,
              undefinedValue,
              args
            );

          // 将silentMethod放入队列并持久化
          const isPushed = pushNewSilentMethod2Queue(
            silentMethodInstance,
            // onFallback绑定了事件后，即使是silent行为模式也不再存储
            // onFallback会同步调用，因此需要异步判断是否存在fallbackHandlers
            len(eventManager.eventMap[FallbackEventKey] || []) <= 0 && behaviorFinally === BEHAVIOR_SILENT,
            queueFinally,

            // 执行放入队列前回调，如果返回false则阻止放入队列
            () => eventManager.emit(BeforePushQueueEventKey, createPushEvent() as any)
          );
          // 只有在放入队列后，才执行放入队列后的回调
          isPushed && eventManager.emit(PushedQueueEventKey, createPushEvent() as any);
        });

        return queueResolvePromise;
      };

      if (behaviorFinally === BEHAVIOR_QUEUE) {
        const forceRequest = sloughConfig(force, args);
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

    // 事件绑定函数
    b: {
      /**
       * 绑定回退事件
       * @param handler 回退事件回调
       */
      onFallback: (handler: FallbackHandler<AG>) => {
        eventManager.on(FallbackEventKey, event => handler(event));
      },

      /**
       * 绑定入队列前事件
       * @param handler 入队列前的事件回调
       */
      onBeforePushQueue: (handler: BeforePushQueueHandler<AG>) => {
        eventManager.on(BeforePushQueueEventKey, event => handler(event));
      },

      /**
       * 绑定入队列后事件
       * @param handler 入队列后的事件回调
       */
      onPushedQueue: (handler: PushedQueueHandler<AG>) => {
        eventManager.on(PushedQueueEventKey, event => handler(event));
      },

      /**
       * 重试事件
       * @param handler 重试事件回调
       */
      onRetry: (handler: RetryHandler<AG>) => {
        eventManager.on(RetryEventKey, event => handler(event));
      }
    }
  };
};
