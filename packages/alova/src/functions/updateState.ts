import { setWithCacheAdapter } from '@/storage/cacheWrapper';
import { getStateCache } from '@/storage/stateCache';
import { promiseStatesHook } from '@/utils/helper';
import myAssert from '@/utils/myAssert';
import { getContext, getLocalCacheConfigParam, getMethodInternalKey, isFn } from '@alova/shared/function';
import { PromiseCls, falseValue, forEach, objectKeys, trueValue, undefinedValue } from '@alova/shared/vars';
import { Method, UpdateStateCollection } from '~/typings';

/**
 * 更新对应method的状态
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 * @returns 是否更新成功，未找到对应的状态时不会更新成功
 */
export default async function updateState<
  State,
  Computed,
  Watched,
  Export,
  Responded,
  Transformed,
  RequestConfig,
  Response,
  ResponseHeader
>(
  matcher: Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
  handleUpdate: ((data: Responded) => any) | UpdateStateCollection<Responded>
) {
  let updated = falseValue;

  // 只处理符合条件的第一个Method实例，如果没有符合条件的实例，则不处理
  if (matcher) {
    const { dehydrate, update } = promiseStatesHook();
    const { hitSource } = matcher;
    const methodKey = getMethodInternalKey(matcher);
    const { id, l1Cache, l2Cache } = getContext(matcher);
    const { s: frontStates, h: hookInstance } = getStateCache(id, methodKey);
    const updateStateCollection = isFn(handleUpdate) ? ({ data: handleUpdate } as UpdateStateCollection<Responded>) : handleUpdate;

    let updatedDataColumnData = undefinedValue as any;
    if (frontStates) {
      // 循环遍历更新数据，并赋值给受监管的状态
      forEach(objectKeys(updateStateCollection), stateName => {
        myAssert(stateName in frontStates, `state named \`${stateName}\` is not found`);
        myAssert(!objectKeys(frontStates).slice(-4).includes(stateName), 'can not update preset states');
        const updatedData = updateStateCollection[stateName as keyof typeof updateStateCollection](
          dehydrate((frontStates as Record<string, any>)[stateName], stateName, hookInstance.ro)
        );

        // 记录data字段的更新值，用于更新缓存数据
        if (stateName === 'data') {
          updatedDataColumnData = updatedData;
        }
        update(
          {
            [stateName]: updatedData
          },
          frontStates,
          hookInstance
        );
      });
      updated = trueValue;
    }

    // 如果更新了data，则需要同时更新缓存和持久化数据
    if (updatedDataColumnData !== undefinedValue) {
      const { e: expireMilliseconds, s: toStore, t: tag } = getLocalCacheConfigParam(matcher);
      await PromiseCls.all([
        setWithCacheAdapter(id, methodKey, updatedDataColumnData, expireMilliseconds, l1Cache, hitSource),
        toStore && setWithCacheAdapter(id, methodKey, updatedDataColumnData, expireMilliseconds, l2Cache, hitSource, tag)
      ]);
    }
  }
  return updated;
}
