import { forEach, objectKeys, pushItem, runArgsHandler, setTimeoutFn, splice } from '@/helper';
import {
  BeforeSilentSubmitHandler,
  SilentFactoryBootOptions,
  SilentSubmitBootHandler,
  SilentSubmitErrorHandler,
  SilentSubmitFailHandler,
  SilentSubmitSuccessHandler
} from '~/typings/general';
import {
  beforeHandlers,
  bootHandlers,
  errorHandlers,
  failHandlers,
  setCustomSerializers,
  setDependentAlova,
  setQueueRequestWaitSetting,
  setSilentFactoryStatus,
  silentFactoryStatus,
  successHandlers
} from './globalVariables';
import { bootSilentQueue, merge2SilentQueueMap, silentQueueMap } from './silentQueue';
import loadSilentQueueMapFromStorage from './storage/loadSilentQueueMapFromStorage';

const offEventCallback = (offHandler: any, handlers: any[]) => () => {
  const index = handlers.indexOf(offHandler);
  index >= 0 && splice(handlers, index, 1);
};

/**
 * 绑定silentSubmit启动事件
 * @param {SilentSubmitBootHandler} handler 事件回调函数
 * @returns 解绑函数
 */
export const onSilentSubmitBoot = (handler: SilentSubmitBootHandler) => {
  pushItem(bootHandlers, handler);
  return offEventCallback(handler, bootHandlers);
};

/**
 * 绑定silentSubmit成功事件
 * @param {SilentSubmitSuccessHandler} handler 事件回调函数
 * @returns 解绑函数
 */
export const onSilentSubmitSuccess = (handler: SilentSubmitSuccessHandler) => {
  pushItem(successHandlers, handler);
  return offEventCallback(handler, successHandlers);
};

/**
 * 绑定silentSubmit错误事件
 * 每次请求错误，触发错误回调
 * @param {SilentSubmitErrorHandler} handler 事件回调函数
 * @returns 解绑函数
 */
export const onSilentSubmitError = (handler: SilentSubmitErrorHandler) => {
  pushItem(errorHandlers, handler);
  return offEventCallback(handler, errorHandlers);
};

/**
 * 绑定silentSubmit失败事件
 * 失败事件将在最大请求次数到达，或不匹配错误信息时触发
 * @param {SilentSubmitFailHandler} handler 事件回调函数
 * @returns 解绑函数
 */
export const onSilentSubmitFail = (handler: SilentSubmitFailHandler) => {
  pushItem(failHandlers, handler);
  return offEventCallback(handler, failHandlers);
};

/**
 * 绑定silentSubmit发起请求前事件
 * @param {BeforeSilentSubmitHandler} handler 事件回调函数
 * @returns 解绑函数
 */
export const onBeforeSilentSubmit = (handler: BeforeSilentSubmitHandler) => {
  pushItem(beforeHandlers, handler);
  return offEventCallback(handler, beforeHandlers);
};

/**
 * 启动静默提交，它将载入缓存中的静默方法，并开始静默提交
 * 如果未传入延迟时间，则立即同步启动
 * @param {SilentFactoryBootOptions} options 延迟毫秒数
 */
export const bootSilentFactory = (options: SilentFactoryBootOptions) => {
  if (silentFactoryStatus === 0) {
    const { alova } = options;
    setDependentAlova(alova);
    setCustomSerializers(options.serializers);
    setQueueRequestWaitSetting(options.requestWait);
    setTimeoutFn(() => {
      // 延时加载，让页面的queue放在最前面
      merge2SilentQueueMap(loadSilentQueueMapFromStorage());
      // 循环启动队列静默提交
      // 多条队列是并行执行的
      forEach(objectKeys(silentQueueMap), queueName => {
        bootSilentQueue(silentQueueMap[queueName], queueName);
      });
      setSilentFactoryStatus(1); // 设置状态为已启动
      runArgsHandler(bootHandlers);
    }, options.delay ?? 500);
  }
};
