import Alova from './Alova';
import { getSilentRequest } from './storage/silentStorage';
import { deserializeMethod, noop, setTimeoutFn, undefinedValue } from './utils/helper';
import sendRequest from './functions/sendRequest';

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

  const backgroundStoragedRequests = alovas
    .map(alova => getSilentRequest(alova.id, alova.storage))
    .filter(({ serializedMethod }) => serializedMethod !== undefinedValue)
    .map(({ serializedMethod, remove }, i) => {
      const { response } = sendRequest(deserializeMethod(serializedMethod!, alovas[i]), true);
      return response().then(remove, noop);   // 如果请求失败需要捕获错误，否则会导致错误往外抛到控制台
    });
  if (backgroundStoragedRequests.length > 0) {
    Promise.all(backgroundStoragedRequests).finally(runSilentRequest);
  } else {
    setTimeoutFn(runSilentRequest, 2000);
  }
}


/**
 * 监听网络变化事件
 */
export default function listenNetwork() {
  window.addEventListener('online', runSilentRequest);
  runSilentRequest();
}