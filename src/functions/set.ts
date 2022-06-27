import Method from '../methods/Method';
import { setResponseCache } from '../storage/responseCache';
import { key } from '../utils/helper';
import { getContext } from '../utils/variables';


/**
* 手动设置缓存响应数据
* @param methodInstance 请求方法对象
* @param data 缓存数据
*/
export default function set<S, E, R, T>(methodInstance: Method<S, E, R, T>, data: R) {
  const {
    staleTime = 0
  } = methodInstance.config;
  methodInstance.context.options
  const getStaleTime = (data: any) => typeof staleTime === 'function' ? staleTime(data, new Headers(), 'GET') : staleTime;
  const staleMilliseconds = getStaleTime(data);
  setResponseCache(getContext(methodInstance).id, key(methodInstance), data, staleMilliseconds);
}