import {
  AlovaOptions,
} from '../typings';
import Alova from './Alova';
import listenNetwork, { addAlova } from './network';
export { default as useRequest } from './hooks/useRequest';
export { default as useWatcher } from './hooks/useWatcher';
export { default as useFetcher } from './hooks/useFetcher';
export { default as invalidateCache } from './functions/invalidateCache';
export { default as updateState } from './functions/updateState';
export { default as setCacheData } from './functions/setCacheData';
export { all } from './Responser';

// 预定义的配置
export { default as GlobalFetch } from './predefine/GlobalFetch';
// 导出缓存模式
export { cacheMode } from './utils/variables';


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