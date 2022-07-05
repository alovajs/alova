import Alova from './Alova';
import { getSilentRequest } from './storage/silentStorage';
import { deserializeMethod, noop } from './utils/helper';
import sendRequest from './functions/sendRequest';
import { PromiseCls, setTimeoutFn } from './utils/variables';

const alovas = [] as Alova<any, any>[];
/**
 * 收集Alova实例
 * @param instance alova实例
 */
export const addAlova = <S, E>(instance: Alova<S, E>) => alovas.push(instance);


/**
 * 运行静默请求，内部会轮询所有的alova实例，并发送请求
 */
function runSilentRequest() {
  // 如果网络异常或没有alova实例，则不继续轮询请求了
  if (!navigator.onLine || alovas.length <= 0) {
    return;
  }

  // 一次同时处理多个alova实例的静默请求
  const backgroundStoragedRequests = [] as Promise<void>[];
  for (let i in alovas) {
    const alova = alovas[i];
    const { serializedMethod, remove } = getSilentRequest(alova.id, alova.storage);
    if (serializedMethod) {
      const { response } = sendRequest(deserializeMethod(serializedMethod, alova), true);
      backgroundStoragedRequests.push(response().then(remove, noop));   // 如果请求失败需要捕获错误，否则会导致错误往外抛到控制台
    }
  }
  backgroundStoragedRequests.length > 0 ? PromiseCls.all(backgroundStoragedRequests).finally(runSilentRequest) : setTimeoutFn(runSilentRequest, 2000);
}


/**
 * 监听网络变化事件
 */
export default function listenNetwork() {
  window.addEventListener('online', runSilentRequest);
  runSilentRequest();
}