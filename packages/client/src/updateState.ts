import { getContext, getMethodInternalKey, isFn } from '@alova/shared/function';
import { falseValue, forEach, objectKeys, trueValue, undefinedValue } from '@alova/shared/vars';
import { AlovaGenerics, Method, promiseStatesHook, setCache } from 'alova';
import { UpdateStateCollection } from '~/typings';
import { coreAssert } from './hooks/core/implements/assert';
import { getStateCache } from './hooks/core/implements/stateCache';

/**
 * 更新对应method的状态
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 * @returns 是否更新成功，未找到对应的状态时不会更新成功
 */
export default async function updateState<AG extends AlovaGenerics>(
  matcher: Method<AG>,
  handleUpdate: ((data: AG['Responded']) => any) | UpdateStateCollection<AG['Responded']>
) {
  let updated = falseValue;

  // 只处理符合条件的第一个Method实例，如果没有符合条件的实例，则不处理
  if (matcher) {
    const { dehydrate, update } = promiseStatesHook();
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
          frontStates as any,
          stateName,
          hookInstance.ro
        );
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
