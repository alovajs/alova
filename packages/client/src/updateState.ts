import {
  PromiseCls,
  falseValue,
  forEach,
  getContext,
  getMethodInternalKey,
  isArray,
  isFn,
  isObject,
  len,
  mapItem,
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
    const hookInstances = getStateCache(id, methodKey);
    const updateStateCollection = isFn(handleUpdate)
      ? ({ data: handleUpdate } as UpdateStateCollection<Responded>)
      : handleUpdate;

    const updatePromises = mapItem(hookInstances, async hookInstance => {
      let updatedDataColumnData = undefinedValue as any;
      if (hookInstance) {
        const { ms: mergedStates, ro: referingObject } = hookInstance;
        // Loop through the updated data and assign it to the supervised state

        forEach(objectKeys(updateStateCollection), stateName => {
          coreAssert(stateName in mergedStates, `state named \`${stateName}\` is not found`);
          const targetStateProxy = mergedStates[stateName as keyof typeof mergedStates];
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
          update(updatedData, mergedStates[stateName as keyof typeof mergedStates].s, stateName, referingObject);
        });
      }

      // If data is updated, cache and persistent data need to be updated at the same time
      if (updatedDataColumnData !== undefinedValue) {
        await setCache(matcher, updatedDataColumnData);
      }
    });

    if (len(updatePromises) > 0) {
      await PromiseCls.all(updatePromises);
      updated = trueValue;
    }
  }
  return updated;
}
