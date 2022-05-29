import {
  AlovaOptions,
  RequestState
} from '../typings';
import Alova from './Alova';
import listenNetwork, { addAlova } from './network';
export { default as useRequest } from './hooks/useRequest';
export { default as useController } from './hooks/useController';
export { default as useWatcher } from './hooks/useWatcher';
export { default as ReactHook } from './predefine/ReactHook';
export { default as VueHook } from './predefine/VueHook';
export { default as GlobalFetch } from './predefine/GlobalFetch';


// 监听网络变化
listenNetwork();

/**
 * 创建Alova实例
 * @param options alova配置参数
 * @returns Alova实例
 */
export function createAlova<S extends RequestState, E extends RequestState>(options: AlovaOptions<S, E>) {
  const alova = new Alova<S, E>(options);
  addAlova(alova);
  return alova;
}