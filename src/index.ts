import {
  AlovaOptions,
} from '../typings';
import Alova from './Alova';
import listenNetwork, { addAlova } from './network';
export { default as useRequest } from './hooks/useRequest';
export { default as useWatcher } from './hooks/useWatcher';
export { default as useFetcher } from './hooks/useFetcher';
export { default as staleData } from './functions/staleData';
export { default as updateState } from './functions/updateState';
export { default as setFreshData } from './functions/setFreshData';
export { all } from './Responser';

// 预定义的配置
export { default as GlobalFetch } from './predefine/GlobalFetch';


/**
 * 创建Alova实例
 * @param options alova配置参数
 * @returns Alova实例
 */
let networkIsListen = false;
export function createAlova<S, E>(options: AlovaOptions<S, E>) {
  const alova = new Alova(options);
  addAlova(alova);
  if (!networkIsListen) {
    // 监听网络变化
    listenNetwork();
    networkIsListen = true;
  }
  return alova;
}