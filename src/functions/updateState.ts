import { MethodMatcher } from '../../typings';
import Method from '../Method';
import { getMethodSnapshot, keyFind } from '../storage/methodSnapshots';
import { setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import { getStateCache } from '../storage/stateCache';
import { getLocalCacheConfigParam, instanceOf, key, walkUpatingDataStructure } from '../utils/helper';
import myAssert from '../utils/myAssert';
import { forEach, getContext, getOptions, len, promiseThen } from '../utils/variables';


/** 保存着静默请求时的promise对象 */
export const silentRequestPromises: Promise<any>[] = [];

/**
 * 更新对应method的状态
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 */
export default function updateState<S, E, R, T, RC, RE, RH>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH>,
  handleUpdate: (data: R) => any
) {
  const methodInstance = instanceOf(matcher, Method as typeof Method<S, E, R, T, RC, RE, RH>) ? matcher : getMethodSnapshot(matcher, keyFind);
  // 只处理符合条件的第一个Method实例，如果没有符合条件的实例，则不处理
  if (methodInstance) {
    const {
      statesHook: { dehydrate, update }
    } = getOptions(methodInstance);
    const methodKey = key(methodInstance);
    const { id, storage } = getContext(methodInstance);
    const originalStates = getStateCache(id, methodKey);

    // 将更新后的数据赋值给data状态
    if (originalStates) {
      const updateStateAndCache = (data: any) => {
        update({
          data,
        }, originalStates);
  
        // 同时需要更新缓存和持久化数据
        const {
          e: expireMilliseconds,
          s: toStorage,
          t: tag,
        } = getLocalCacheConfigParam(methodInstance);
        setResponseCache(id, methodKey, data, expireMilliseconds);
        toStorage && persistResponse(id, methodKey, data, expireMilliseconds, storage, tag);
      }
      
      let updatedData = handleUpdate(
        dehydrate(originalStates.data)
      );
      let catchedAttrs: ReturnType<typeof walkUpatingDataStructure>['c'] = [];
      try {
        let {
          f,
          c,
        } = walkUpatingDataStructure(updatedData);
        updatedData = f;
        catchedAttrs = c;
      } catch (error) {
        // 如果有循环引用则不去解析了
      }
      updateStateAndCache(updatedData);

      // 有延迟更新时才去执行
      if (len(catchedAttrs) > 0) {
        // 使用第一个即可，在useHookToSendRequest中会维护这个队列
        const silentRequestPromise = silentRequestPromises[0];
        myAssert(!!silentRequestPromise && len(catchedAttrs) > 0, 'delayed update only can use at silent submit and must be called in onSuccess handler');
        promiseThen(silentRequestPromise, rawData => {
          for (let i in catchedAttrs) {
            const { p: position, h: value } = catchedAttrs[i];
            if (len(position) <= 0) {
              updatedData = value(rawData);
              break;
            } else {
              let nestedValue = updatedData;
              forEach(position, (key, i) => {
                if (i >= len(position) - 1) {
                  nestedValue[key] = value(rawData);
                } else {
                  nestedValue = nestedValue[key];
                }
              });
            }
          }
          updateStateAndCache(updatedData);
        });
      }
    }
  }
}