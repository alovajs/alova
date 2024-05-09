import { Alova } from 'alova';
import { createAssert, isArray } from '@/helper';
import { DEFAUT_QUEUE_NAME } from '@/helper/variables';
import {
  BeforeSilentSubmitHandler,
  DataSerializer,
  QueueRequestWaitSetting,
  SilentSubmitBootHandler,
  SilentSubmitErrorHandler,
  SilentSubmitFailHandler,
  SilentSubmitSuccessHandler
} from '~/typings/general';

/**
 * 全局的虚拟数据收集数组
 * 它只会在method创建时为数组，其他时间为undefined
 *
 * 解释：收集虚拟数据的目的为了判断某个method实例内是否使用了虚拟数据
 * 包括以下形式：
 * useSQRequest((vDataId) => createMethod({ vDataId }) // 引用函数参数
 * useSQRequest(() => createMethod({ vDataId }) // 直接引用作用域参数
 *
 * 甚至是：
 * function createMethod(obj) {
 *   return alovaInst.Get('/list', {
 *     params: { status: obj.vDataId ? 1 : 0 }
 *   })
 * }
 * useSQRequest(() => createMethod(obj) // 直接引用作用域参数
 *
 * 使用虚拟数据的方式包含：
 * 1. 直接作为参数赋值
 * 2. 使用虚拟数据id
 * 3. 间接使用虚拟数据，如
 *    vData ? 1 : 0
 *    !!vData
 *    vData + 1
 *    等作为计算参数参与的形式
 */
export let vDataIdCollectBasket: Record<string, undefined> | undefined;
export const setVDataIdCollectBasket = (value: typeof vDataIdCollectBasket) => (vDataIdCollectBasket = value);

/**
 * 依赖的alova实例，它的存储适配器、请求适配器等将用于存取SilentMethod实例，以及发送静默提交
 */
export let dependentAlovaInstance: Alova<any, any, any, any, any>;
export const setDependentAlova = (alovaInst: Alova<any, any, any, any, any>) => {
  dependentAlovaInstance = alovaInst;
};

/**
 * 设置自定义的序列化器
 */
export let customSerializers: Record<string | number, DataSerializer> = {};
export const setCustomSerializers = (serializers: typeof customSerializers = {}) => {
  customSerializers = serializers;
};

/**
 * silentFactory状态
 * 0表示未启动
 * 1表示进行中，调用bootSilentFactory后变更
 * 2表示请求失败，即按重试规则请求达到最大次数时，或不匹配重试规则时变更
 */
export let silentFactoryStatus = 0;
export const setSilentFactoryStatus = (status: 0 | 1 | 2) => (silentFactoryStatus = status);

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
 *   { name: 'customName', wait: 5000 },
 *
 *   // 表示前缀为prefix的所有队列中，method实例名为xxx的请求设置等待5000ms
 *   { name: /^prefix/, wait: silentMethod => silentMethod.entity.config.name === 'xxx' ? 5000 : 0 },
 * ]
 *
 * >>> 它只在请求成功时起作用，如果失败则会使用重试策略参数
 */
export let queueRequestWaitSetting: QueueRequestWaitSetting[] = [];
export const setQueueRequestWaitSetting = (requestWaitSetting: QueueRequestWaitSetting[] | QueueRequestWaitSetting['wait'] = 0) => {
  queueRequestWaitSetting = isArray(requestWaitSetting)
    ? (requestWaitSetting as QueueRequestWaitSetting[])
    : [
        {
          queue: DEFAUT_QUEUE_NAME,
          wait: requestWaitSetting as QueueRequestWaitSetting['wait']
        }
      ];
};

/** 全局的silent事件回调函数 */
export const bootHandlers = [] as SilentSubmitBootHandler[];
export const beforeHandlers = [] as BeforeSilentSubmitHandler[];
export const successHandlers = [] as SilentSubmitSuccessHandler[];
export const errorHandlers = [] as SilentSubmitErrorHandler[];
export const failHandlers = [] as SilentSubmitFailHandler[];

/** silentAssert */
export const silentAssert = createAssert('useSQHook');
