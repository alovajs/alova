import { AlovaCompleteEvent, Method } from '../../typings';
import { forEach, ObjectCls, objectKeys, undefinedValue } from './variables';

/**
 * 创建统一的事件对象
 *
 */
export default <S, E, R, T, RC, RE, RH>(
  eventType: number,
  method: Method<S, E, R, T, RC, RE, RH>,
  sendArgs: any[],
  data?: R,
  error?: any,
  status?: AlovaCompleteEvent<S, E, R, T, RC, RE, RH>['status']
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
    status
  };
  const eventInstance: any = {};
  forEach(objectKeys(allPropsEvent), key => {
    allPropsEvent[key as keyof typeof allPropsEvent] !== undefinedValue &&
      (eventInstance[key] = allPropsEvent[key as keyof typeof allPropsEvent]);
  });

  // 将此类的对象重新命名，让它看上去是由不同的类生成的对象
  // 以此来对应typescript中定义的类型
  const typeName = ['AlovaSuccessEvent', 'AlovaErrorEvent', 'AlovaCompleteEvent'][eventType];
  typeName &&
    ObjectCls.defineProperty(eventInstance, Symbol.toStringTag, {
      value: typeName
    });
  return eventInstance;
};
