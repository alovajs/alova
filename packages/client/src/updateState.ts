import { getContext, getMethodInternalKey, isFn, isObject } from '@alova/shared/function';
import { falseValue, forEach, isArray, objectKeys, trueValue, undefinedValue } from '@alova/shared/vars';
import { AlovaGenerics, Method, promiseStatesHook, setCache } from 'alova';
import { UpdateStateCollection } from '~/typings/clienthook';
import { coreAssert } from './hooks/core/implements/assert';
import { getStateCache } from './hooks/core/implements/stateCache';

/**
 * 更新对应method的状态
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 * @returns 是否更新成功，未找到对应的状态时不会更新成功
 */
export default async function updateState<Responded = unknown>(
  matcher: Method<AlovaGenerics<Responded extends unknown ? any : Responded>>,
  handleUpdate: ((data: Responded) => any) | UpdateStateCollection<Responded>
) {
  let updated = falseValue;

  // 只处理符合条件的第一个Method实例，如果没有符合条件的实例，则不处理
  if (matcher) {
    const { update } = promiseStatesHook();
    const methodKey = getMethodInternalKey(matcher);
    const { id } = getContext(matcher);
    const { s: frontStates, h: hookInstance } = getStateCache(id, methodKey);
    const updateStateCollection = isFn(handleUpdate)
      ? ({ data: handleUpdate } as UpdateStateCollection<Responded>)
      : handleUpdate;

    let updatedDataColumnData = undefinedValue as any;
    if (frontStates) {
      // 循环遍历更新数据，并赋值给受监管的状态
      forEach(objectKeys(updateStateCollection), stateName => {
        coreAssert(stateName in frontStates, `state named \`${stateName}\` is not found`);
        const targetStateProxy = frontStates[stateName as keyof typeof frontStates];
        let updatedData = updateStateCollection[stateName as keyof typeof updateStateCollection](targetStateProxy.v);

        // shallow clone the updatedData so that can effect in react.
        updatedData = isArray(updatedData)
          ? [...updatedData]
          : isObject(updatedData)
            ? { ...updatedData }
            : updatedData;

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
