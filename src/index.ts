import { AlovaOptions } from '../typings';
import Alova, { alovas } from './Alova';
import myAssert from './utils/myAssert';
import { getStatesHook, pushItem } from './utils/variables';
export { default as invalidateCache } from './functions/invalidateCache';
export { default as setCache } from './functions/setCache';
export { default as updateState } from './functions/updateState';
export { default as useFetcher } from './hooks/useFetcher';
export { default as useRequest } from './hooks/useRequest';
export { default as useWatcher } from './hooks/useWatcher';
export { default as Method } from './Method';

/**
 * 创建Alova实例
 * @param options alova配置参数
 * @returns Alova实例
 */
export const createAlova = <S, E, RC, RE, RH>(options: AlovaOptions<S, E, RC, RE, RH>) => {
  const alovaInstance = new Alova(options);
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
-> More awesome alova hooks: https://alova.js.org/category/extend-hooks
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
