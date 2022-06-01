import Method from '../methods/Method';
import { removeResponseCache } from '../storage/responseCache';
import { getContext, getOptions, key } from '../utils/helper';


/**
* 让对应的返回数据缓存失效
* @param method 请求方法对象
*/
export default function invalidate<S, E, R, T>(methodInstance: Method<S, E, R, T>) {
 removeResponseCache(getContext(methodInstance).id, getOptions(methodInstance).baseURL, key(methodInstance));
}