import {
  falseValue,
  forEach,
  getContext,
  getMethodInternalKey,
  isArray,
  isFn,
  isObject,
  objectKeys,
  trueValue,
  undefinedValue
} from '@alova/shared';
import { AlovaGenerics, Method, promiseStatesHook, setCache } from 'alova';
import { UpdateStateCollection } from '~/typings/clienthook';
import { coreAssert } from './hooks/core/implements/assert';
import { getStateCache } from './hooks/core/implements/stateCache';

/**
 * Update the status of the corresponding method
 * @param method request method object
 * @param handleUpdate update callback
 * @returns Whether the update is successful or not. If the corresponding status is not found, the update will not be successful.
 */
export default async function updateState<Responded = unknown>(
  matcher: Method<AlovaGenerics<Responded extends unknown ? any : Responded>>,
  handleUpdate: ((data: Responded) => any) | UpdateStateCollection<Responded>
) {
  let updated = falseValue;

  // Only process the first method instance that meets the conditions. If there is no instance that meets the conditions, it will not be processed.
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
      // Loop through the updated data and assign it to the supervised state
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

        // Record the updated value of the data field, used to update cached data
        if (stateName === 'data') {
          updatedDataColumnData = updatedData;
        }

        // Update directly using update without checking referring object.tracked keys
        update(updatedData, frontStates[stateName as keyof typeof frontStates].s, stateName, hookInstance.ro);
      });
      updated = trueValue;
    }

    // If data is updated, cache and persistent data need to be updated at the same time
    if (updatedDataColumnData !== undefinedValue) {
      setCache(matcher, updatedDataColumnData);
    }
  }
  return updated;
}
