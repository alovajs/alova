import Method from '../methods/Method';
import { removeResponseCache } from '../storage/responseCache';
import { key } from '../utils/helper';
import { getContext } from '../utils/variables';


/**
* 让对应的返回数据缓存失效
* @param methodInstance 请求方法对象
*/
export default function staleData<S, E, R, T>(methodInstance: Method<S, E, R, T>) {
  removeResponseCache(getContext(methodInstance).id, key(methodInstance));
}