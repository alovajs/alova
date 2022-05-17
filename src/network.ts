import { RequestState } from '../typings';
import Alova from './Alova';

const alovas = [] as Alova<any, any>[];
/**
 * 收集Alova实例
 * @param instance alova实例
 */
export function addAlova<S extends RequestState, E extends RequestState>(instance: Alova<S, E>) {
  alovas.push(instance);
}


/**
 * 启动静默请求，内部会轮询所有的alova实例，并发送请求
 */
function runSilentRequest() {
  alovas.forEach(alova => {
    alova.silentRequest();
  });
}


/**
 * 关闭静默请求，内部会轮询所有的alova实例，并发送请求
 */
function disableSilentRequest() {

}

/**
 * 监听网络变化事件
 */
export default function listenNetwork() {
  window.addEventListener('online', enableSilentRequest);
  window.addEventListener('offline', disableSilentRequest);
}