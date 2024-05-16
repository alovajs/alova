import { ObjectCls, forEach, objectKeys, undefinedValue } from '@alova/shared/vars';
import type { AlovaCompleteEvent, AlovaGenerics, Method } from 'alova';

export const KEY_SUCCESS = 'success';
export const KEY_ERROR = 'error';
export const KEY_COMPLETE = 'complete';

/**
 * 事件类型枚举
 */
export const enum AlovaEventType {
  AlovaSuccessEvent,
  AlovaErrorEvent,
  AlovaCompleteEvent,
  AlovaEvent
}

/**
 * 创建统一的事件对象
 */
export default <AG extends AlovaGenerics>(
  eventType: AlovaEventType,
  method: Method<AG>,
  sendArgs: any[],
  fromCache?: boolean,
  data?: AG['Responded'],
  error?: any,
  status?: AlovaCompleteEvent<AG>['status']
) => {
  const allPropsEvent = {
    /** 事件对应的请求行为 */
    /** 当前的method实例 */
    method,

    /** 通过send触发请求时传入的参数 */
    sendArgs,

    /** 响应数据，只在成功时有值 */
    data,

    /** 失败时抛出的错误，只在失败时有值 */
    error,

    /** 请求状态 */
    status,

    /** data数据是否来自缓存，当status为error时，fromCache始终为false */
    fromCache
  };
  const eventInstance: any = {};
  forEach(objectKeys(allPropsEvent), key => {
    allPropsEvent[key as keyof typeof allPropsEvent] !== undefinedValue &&
      (eventInstance[key] = allPropsEvent[key as keyof typeof allPropsEvent]);
  });

  // 将此类的对象重新命名，让它看上去是由不同的类生成的对象
  // 以此来对应typescript中定义的类型
  const typeName = ['AlovaSuccessEvent', 'AlovaErrorEvent', 'AlovaCompleteEvent', 'AlovaEvent'][eventType];
  typeName &&
    ObjectCls.defineProperty(eventInstance, Symbol.toStringTag, {
      value: typeName
    });
  return eventInstance;
};
