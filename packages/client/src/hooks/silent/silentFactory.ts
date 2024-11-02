import { forEach, objectKeys, setTimeoutFn, undefinedValue } from '@alova/shared';
import {
  BeforeSilentSubmitHandler,
  SilentFactoryBootOptions,
  SilentSubmitBootHandler,
  SilentSubmitErrorHandler,
  SilentSubmitFailHandler,
  SilentSubmitSuccessHandler
} from '~/typings/clienthook';
import {
  BeforeEventKey,
  BootEventKey,
  ErrorEventKey,
  FailEventKey,
  SuccessEventKey,
  globalSQEventManager,
  setCustomSerializers,
  setDependentAlova,
  setQueueRequestWaitSetting,
  setSilentFactoryStatus,
  silentFactoryStatus
} from './globalVariables';
import { bootSilentQueue, merge2SilentQueueMap, silentQueueMap } from './silentQueue';
import loadSilentQueueMapFromStorage from './storage/loadSilentQueueMapFromStorage';

/**
 * Bind silentSubmit startup event
 * @param {SilentSubmitBootHandler} handler event callback function
 * @returns unbind function
 */
export const onSilentSubmitBoot = (handler: SilentSubmitBootHandler) => globalSQEventManager.on(BootEventKey, handler);

/**
 * Bind silentSubmit success event
 * @param {SilentSubmitSuccessHandler} handler event callback function
 * @returns unbind function
 */
export const onSilentSubmitSuccess = (handler: SilentSubmitSuccessHandler) =>
  globalSQEventManager.on(SuccessEventKey, handler);

/**
 * Bind silentSubmit error event
 * Every time there is a request error, an error callback is triggered.
 * @param {SilentSubmitErrorHandler} handler event callback function
 * @returns unbind function
 */
export const onSilentSubmitError = (handler: SilentSubmitErrorHandler) =>
  globalSQEventManager.on(ErrorEventKey, handler);

/**
 * Binding silentSubmit failure event
 * The failure event will be triggered when the maximum number of requests is reached, or when the error message does not match
 * @param {SilentSubmitFailHandler} handler event callback function
 * @returns unbind function
 */
export const onSilentSubmitFail = (handler: SilentSubmitFailHandler) => globalSQEventManager.on(FailEventKey, handler);

/**
 * Bind silentSubmit to initiate a pre-request event
 * @param {BeforeSilentSubmitHandler} handler event callback function
 * @returns unbind function
 */
export const onBeforeSilentSubmit = (handler: BeforeSilentSubmitHandler) =>
  globalSQEventManager.on(BeforeEventKey, handler);

/**
 * Start silent submission, which will load the silent method in the cache and start silent submission
 * If no delay time is passed in, the sync starts immediately
 * @param {SilentFactoryBootOptions} options Delay in milliseconds
 */
export const bootSilentFactory = (options: SilentFactoryBootOptions) => {
  if (silentFactoryStatus === 0) {
    const { alova, delay = 500 } = options;
    setDependentAlova(alova);
    setCustomSerializers(options.serializers);
    setQueueRequestWaitSetting(options.requestWait);
    setTimeoutFn(async () => {
      // Delayed loading puts the page’s queue at the front
      merge2SilentQueueMap(await loadSilentQueueMapFromStorage());
      // Loop start queue silent submission
      // Multiple queues are executed in parallel
      forEach(objectKeys(silentQueueMap), queueName => {
        bootSilentQueue(silentQueueMap[queueName], queueName);
      });
      setSilentFactoryStatus(1); // Set status to Started
      globalSQEventManager.emit(BootEventKey, undefinedValue);
    }, delay);
  }
};
