import { getContext, getMethodInternalKey, isFn } from '@alova/shared/function';
import { falseValue, forEach, objectKeys, trueValue, undefinedValue } from '@alova/shared/vars';
import { AlovaGenerics, Method, promiseStatesHook, setCache } from 'alova';
import { UpdateStateCollection } from '~/typings';
import { coreAssert } from './hooks/core/implements/assert';
import { getStateCache } from './hooks/core/implements/stateCache';

/**
 * cross components to update states by specifing method instance.
 * @example
 * ```js
 * updateState(methodInstance, newData);
 * updateState(methodInstance, oldData => {
 *   oldData.name = 'new name';
 *   return oldData;
 * });
 * ```
 * @param matcher method instance
 * @param handleUpdate new data or update function that returns new data
 * @returns is updated
 */
export default async function updateState<AG extends AlovaGenerics>(
  matcher: Method<AG>,
  handleUpdate: ((data: AG['Responded']) => any) | UpdateStateCollection<AG['Responded']>
) {
  let updated = falseValue;

  // 只处理符合条件的第一个Method实例，如果没有符合条件的实例，则不处理
  if (matcher) {
    const { update } = promiseStatesHook();
    const methodKey = getMethodInternalKey(matcher);
    const { id } = getContext(matcher);
    const { s: frontStates, h: hookInstance } = getStateCache(id, methodKey);
    const updateStateCollection = isFn(handleUpdate)
      ? ({ data: handleUpdate } as UpdateStateCollection<AG['Responded']>)
      : handleUpdate;

    let updatedDataColumnData = undefinedValue as any;
    if (frontStates) {
      // 循环遍历更新数据，并赋值给受监管的状态
      forEach(objectKeys(updateStateCollection), stateName => {
        coreAssert(stateName in frontStates, `state named \`${stateName}\` is not found`);
        coreAssert(!objectKeys(frontStates).slice(-4).includes(stateName), 'can not update preset states');
        const targetStateProxy = frontStates[stateName as keyof typeof frontStates];
        const updatedData = updateStateCollection[stateName as keyof typeof updateStateCollection](targetStateProxy.v);

        // 记录data字段的更新值，用于更新缓存数据
        if (stateName === 'data') {
          updatedDataColumnData = updatedData;
        }

        // 直接使用update更新，不检查referingObject.trackedKeys
        update(updatedData, frontStates[stateName as keyof typeof frontStates].s, stateName, hookInstance.ro);
      });
      updated = trueValue;
    }

    // 如果更新了data，则需要同时更新缓存和持久化数据
    if (updatedDataColumnData !== undefinedValue) {
      setCache(matcher, updatedDataColumnData);
    }
  }
  return updated;
}
