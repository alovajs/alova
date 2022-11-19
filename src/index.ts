import { AlovaOptions } from '../typings';
import Alova from './Alova';
import listenNetwork, { addAlova } from './network';
import { falseValue, trueValue } from './utils/variables';
export { default as invalidateCache } from './functions/invalidateCache';
export { default as setCacheData } from './functions/setCacheData';
export { default as updateState } from './functions/updateState';
export { default as useFetcher } from './hooks/useFetcher';
export { default as useRequest } from './hooks/useRequest';
export { default as useWatcher } from './hooks/useWatcher';
// 导出缓存模式
export { cacheMode } from './utils/variables';

/**
 * 创建Alova实例
 * @param options alova配置参数
 * @returns Alova实例
 */
let networkIsListen = falseValue;
export function createAlova<S, E, RC, RE, RH>(options: AlovaOptions<S, E, RC, RE, RH>) {
  const alova = new Alova(options);
  addAlova(alova);
  if (!networkIsListen) {
    // 监听网络变化
    listenNetwork();
    networkIsListen = trueValue;
  }
  return alova;
}

if (process.env.NODE_ENV === 'development') {
  const consoleInfo = () => {
    console.log(`[alova]Using mock data: https://alova.js.org/extension/alova-mock`);
    console.log(`[alova]More awesome alova hooks: https://alova.js.org/category/extend-hooks`);
    console.log('Please give alova a star if you like it: https://github.com/alovajs/alova');
    console.log(
      '[alova]This tips will remove in production environment. hide it in development: https://alova.js.org/others/hide-recommend-tips'
    );
  };

  try {
    // @ts-ignore
    import.meta.env.VITE_ALOVA_TIPS !== '0' && consoleInfo();
  } catch (e) {}
  try {
    if (process.env.VUE_APP_ALOVA_TIPS !== '0' && process.env.REACT_APP_ALOVA_TIPS !== '0') {
      consoleInfo();
    }
  } catch (e) {}
}
