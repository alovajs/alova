import { RequestState } from '../../typings';
import Method from '../methods/Method';
import { removeResponseCache } from '../storage/responseCache';
import { key } from '../utils/helper';


/**
* 让对应的返回数据缓存失效
* @param method 请求方法对象
*/
export default function invalidate<S extends RequestState, E extends RequestState, R, T>(method: Method<S, E, R, T>) {
 removeResponseCache(method.context.id, method.context.options.baseURL, key(method));
}