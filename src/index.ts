import { AlovaOptions } from '../typings';
import Alova, { alovas } from './Alova';
import { newInstance } from './utils/helper';
import myAssert from './utils/myAssert';
import { getStatesHook, pushItem } from './utils/variables';
export * from './functions/manipulateCache';
export { default as updateState } from './functions/updateState';
export { default as useFetcher } from './hooks/useFetcher';
export { default as useRequest } from './hooks/useRequest';
export { default as useWatcher } from './hooks/useWatcher';
export { default as Method } from './Method';
export { matchSnapshotMethod } from './storage/methodSnapShots';
export { key as getMethodKey } from './utils/helper';

/**
 * 创建Alova实例
 * @param options alova配置参数
 * @returns Alova实例
 */
export const createAlova = <S, E, RC, RE, RH>(options: AlovaOptions<S, E, RC, RE, RH>) => {
  const alovaInstance = newInstance(Alova<S, E, RC, RE, RH>, options);
  if (alovas[0]) {
    myAssert(
      getStatesHook(alovas[0]) === getStatesHook(alovaInstance),
      'must use the same statesHook in one environment'
    );
  }
  pushItem(alovas, alovaInstance);
  return alovaInstance;
};

/* c8 ignore start */
if (process.env.NODE_ENV === 'development') {
  const consoleInfo = () => {
    console.log(`[alova tips]
-> Powerful request strategies: https://alova.js.org//category/strategy
-> Using mock data: https://alova.js.org/extension/alova-mock
-> Please give alova a star if you like it: https://github.com/alovajs/alova
-> This tips will remove in production environment. hide it in development: https://alova.js.org/others/hide-recommend-tips`);
  };

  try {
    // @ts-ignore
    if (import.meta.env.VITE_ALOVA_TIPS !== '0') {
      consoleInfo();
    }
  } catch (e) {}
  try {
    if (process.env.VUE_APP_ALOVA_TIPS !== '0' && process.env.REACT_APP_ALOVA_TIPS !== '0') {
      consoleInfo();
    }
  } catch (e) {}
}
/* c8 ignore stop */
