import {
  AlovaOptions,
  RequestState
} from '../typings';
import Alova from './Alova';
export { default as useRequest } from './hooks/useRequest';
export { default as useWatcher } from './hooks/useWatcher';
export { default as useEffectWatcher } from './hooks/useEffectWatcher';

export { default as ReactHook } from './predefined/ReactHook';
export { default as VueHook } from './predefined/VueHook';
export { default as createLocalStorageSilentConfig } from './predefined/createLocalStorageSilentConfig';

export function createAlova<
  S extends RequestState,
  E extends RequestState
>(options: AlovaOptions<S, E>) {
  return new Alova<S, E>(options);
}