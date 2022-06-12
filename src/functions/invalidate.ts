import Method from '../methods/Method';
import { removeResponseCache } from '../storage/responseCache';
import { key } from '../utils/helper';
import { getContext, getOptions } from '../utils/variables';


/**
* 让对应的返回数据缓存失效
* @param method 请求方法对象
*/
export default function invalidate<S, E, R, T>(methodInstance: Method<S, E, R, T>) {
 removeResponseCache(getContext(methodInstance).id, getOptions(methodInstance).baseURL, key(methodInstance));
}