import { forEach, objectKeys, setTimeoutFn, undefinedValue } from '@alova/shared/vars';
import { Alova, AlovaGenerics } from 'alova';
import {
  DataSerializer,
  GlobalSQErrorEvent,
  GlobalSQEvent,
  GlobalSQFailEvent,
  GlobalSQSuccessEvent,
  QueueRequestWaitSetting
} from '~/typings/general';
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

export type SilentSubmitBootHandler = () => void;
export type BeforeSilentSubmitHandler<AG extends AlovaGenerics> = (event: GlobalSQEvent<AG>) => void;
export type SilentSubmitSuccessHandler<AG extends AlovaGenerics> = (event: GlobalSQSuccessEvent<AG>) => void;
export type SilentSubmitErrorHandler<AG extends AlovaGenerics> = (event: GlobalSQErrorEvent<AG>) => void;
export type SilentSubmitFailHandler<AG extends AlovaGenerics> = (event: GlobalSQFailEvent<AG>) => void;

/** SilentFactory启动选项 */
export interface SilentFactoryBootOptions<AG extends AlovaGenerics> {
  /**
   * silentMethod依赖的alova实例
   * alova实例的存储适配器、请求适配器等将用于存取SilentMethod实例，以及发送静默提交
   */
  alova: Alova<AG>;

  /** 延迟毫秒数，不传时默认延迟2000ms */
  delay?: number;

  /**
   * 序列化器集合，用于自定义转换为序列化时某些不能直接转换的数据
   * 集合的key作为它的名字进行序列化，当反序列化时会将对应名字的值传入backward函数中
   * 因此，在forward中序列化时需判断是否为指定的数据，并返回转换后的数据，否则返回undefined或不返回
   * 而在backward中可通过名字来识别，因此只需直接反序列化即可
   * 内置的序列化器：
   * 1. date序列化器用于转换日期
   * 2. regexp序列化器用于转化正则表达式
   *
   * >>> 可以通过设置同名序列化器来覆盖内置序列化器
   */
  serializers?: Record<string | number, DataSerializer>;

  /**
   * silentQueue内的请求等待时间，单位为毫秒（ms）
   * 它表示即将发送请求的silentMethod的等待时间
   * 如果未设置，或设置为0表示立即触发silentMethod请求
   *
   * Tips:
   * 1. 直接设置时默认对default queue有效
   * 2. 如果需要对其他queue设置可指定为对象，如：
   * [
   *   表示对名为customName的队列设置请求等待5000ms
   *   { queue: 'customName', wait: 5000 },
   *
   *   // 表示前缀为prefix的所有队列中，method实例名为xxx的请求设置等待5000ms
   *   { queue: /^prefix/, wait: silentMethod => silentMethod.entity.config.name === 'xxx' ? 5000 : 0 },
   * ]
   *
   * >>> 它只在请求成功时起作用，如果失败则会使用重试策略参数
   */
  requestWait?: QueueRequestWaitSetting[] | QueueRequestWaitSetting['wait'];
}

/**
 * 绑定silentSubmit启动事件
 * @param {SilentSubmitBootHandler} handler 事件回调函数
 * @returns 解绑函数
 */
export const onSilentSubmitBoot = (handler: SilentSubmitBootHandler) => globalSQEventManager.on(BootEventKey, handler);

/**
 * 绑定silentSubmit成功事件
 * @param {SilentSubmitSuccessHandler} handler 事件回调函数
 * @returns 解绑函数
 */
export const onSilentSubmitSuccess = <AG extends AlovaGenerics>(handler: SilentSubmitSuccessHandler<AG>) =>
  globalSQEventManager.on(SuccessEventKey, handler);

/**
 * 绑定silentSubmit错误事件
 * 每次请求错误，触发错误回调
 * @param {SilentSubmitErrorHandler} handler 事件回调函数
 * @returns 解绑函数
 */
export const onSilentSubmitError = <AG extends AlovaGenerics>(handler: SilentSubmitErrorHandler<AG>) =>
  globalSQEventManager.on(ErrorEventKey, handler);

/**
 * 绑定silentSubmit失败事件
 * 失败事件将在最大请求次数到达，或不匹配错误信息时触发
 * @param {SilentSubmitFailHandler} handler 事件回调函数
 * @returns 解绑函数
 */
export const onSilentSubmitFail = <AG extends AlovaGenerics>(handler: SilentSubmitFailHandler<AG>) =>
  globalSQEventManager.on(FailEventKey, handler);

/**
 * 绑定silentSubmit发起请求前事件
 * @param {BeforeSilentSubmitHandler} handler 事件回调函数
 * @returns 解绑函数
 */
export const onBeforeSilentSubmit = <AG extends AlovaGenerics>(handler: BeforeSilentSubmitHandler<AG>) =>
  globalSQEventManager.on(BeforeEventKey, handler);

/**
 * 启动静默提交，它将载入缓存中的静默方法，并开始静默提交
 * 如果未传入延迟时间，则立即同步启动
 * @param {SilentFactoryBootOptions} options 延迟毫秒数
 */
export const bootSilentFactory = <AG extends AlovaGenerics>(options: SilentFactoryBootOptions<AG>) => {
  if (silentFactoryStatus === 0) {
    const { alova, delay = 500 } = options;
    setDependentAlova<AG>(alova);
    setCustomSerializers(options.serializers);
    setQueueRequestWaitSetting(options.requestWait);
    setTimeoutFn(async () => {
      // 延时加载，让页面的queue放在最前面
      merge2SilentQueueMap(await loadSilentQueueMapFromStorage());
      // 循环启动队列静默提交
      // 多条队列是并行执行的
      forEach(objectKeys(silentQueueMap), queueName => {
        bootSilentQueue(silentQueueMap[queueName], queueName);
      });
      setSilentFactoryStatus(1); // 设置状态为已启动
      globalSQEventManager.emit(BootEventKey, undefinedValue);
    }, delay);
  }
};
