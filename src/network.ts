import Alova from './Alova';
import { getSilentRequest } from './storage/silentStorage';
import { deserializeMethod, noop } from './utils/helper';
import sendRequest from './functions/sendRequest';

const alovas = [] as Alova<any, any>[];
/**
 * 收集Alova实例
 * @param instance alova实例
 */
export const addAlova = <S, E>(instance: Alova<S, E>) => alovas.push(instance);


/**
 * 运行静默请求，内部会轮询所有的alova实例，并发送请求
 * @param activeIndex 当前激活的alova实例索引
 */
function runSilentRequest(activeIndex: number) {
  // 如果达到了数组长度，则重新从0开始获取
  activeIndex = activeIndex >= alovas.length ? 0 : activeIndex;
  const alova = alovas[activeIndex];
  // 如果网络异常，则不继续轮询请求了
  if (!navigator.onLine || !alova) {
    return;
  }

  const { serializedMethod, remove } = getSilentRequest(alova.id, alova.storage);
  if (serializedMethod) {
    const { response } = sendRequest(deserializeMethod(serializedMethod, alova), true);
    response()
      .then(remove)
      .catch(noop)    // 如果请求失败需要捕获错误，否则会导致错误往外抛到控制台
      .finally(() => runSilentRequest(activeIndex + 1));
  } else {
    setTimeout(() => runSilentRequest(activeIndex + 1), 2000);
  }
}


/**
 * 监听网络变化事件
 */
export default function listenNetwork() {
  window.addEventListener('online', () => runSilentRequest(0));
  runSilentRequest(0);
}