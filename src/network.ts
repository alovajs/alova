import Alova from './Alova';
import { getSilentRequest } from './storage/silentStorage';
import { noop } from './utils/helper';
import sendRequest from './functions/sendRequest';
import { getStatesHook, len, PromiseCls, promiseThen, pushItem, setTimeoutFn, trueValue } from './utils/variables';
import myAssert from './utils/myAssert';
import { SerializedMethod } from '../typings';
import Method from './Method';

const intervalTime = 2000;  // 重复请求间隔时间
export const alovas = [] as Alova<any, any, any, any, any>[];

/**
 * 反序列化请求方法对象
 * @param methodInstance 请求方法对象
 * @returns 请求方法对象
 */
 export const deserializeMethod = <S, E, RC, RE, RH>({
  type,
  url,
  config,
  requestBody
}: SerializedMethod<any, any, RC, RH>, alova: Alova<S, E, RC, RE, RH>) => new Method<S, E, any, any, RC, RE, RH>(type, alova, url, config, requestBody);
/**
 * 收集Alova实例
 * @param instance alova实例
 */
export const addAlova = <S, E, RC, RE, RH>(instance: Alova<S, E, RC, RE, RH>) => {
  if (alovas[0]) {
    myAssert(getStatesHook(alovas[0]) === getStatesHook(instance), 'must use the same statesHook in one environment');
  }
  pushItem(alovas, instance);
};

/**
 * 运行静默请求，内部会轮询所有的alova实例，并发送请求
 */
function runSilentRequest() {
  // 如果网络异常或没有alova实例，则不继续轮询请求了
  if (!navigator.onLine || len(alovas) <= 0) {
    return;
  }

  // 一次同时处理多个alova实例的静默请求
  const backgroundStoragedRequests = [] as Promise<void>[];
  for (let i in alovas) {
    const alova = alovas[i];
    const { serializedMethod, remove } = getSilentRequest(alova.id, alova.storage);
    if (serializedMethod) {
      const { response } = sendRequest(deserializeMethod(serializedMethod, alova), trueValue);
      pushItem(
        backgroundStoragedRequests,
        promiseThen(response(), remove, noop)
      );    // 如果请求失败需要捕获错误，否则会导致错误往外抛到控制台
    }
  }

  PromiseCls.all(backgroundStoragedRequests).finally(() => {
    setTimeoutFn(runSilentRequest, intervalTime);
  });
}


/**
 * 监听网络变化事件
 */
export default function listenNetwork() {
  runSilentRequest();
  window.addEventListener('online', runSilentRequest);
}