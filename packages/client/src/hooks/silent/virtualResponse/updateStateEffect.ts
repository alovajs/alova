import updateState from '@/updateState';
import { isFn, objectKeys, undefinedValue } from '@alova/shared';
import { currentSilentMethod } from '../createSilentQueueMiddlewares';

/**
 * Update the status of the corresponding method
 * Unlike updateState, in addition to updating the state immediately, it will also update again after responding in silent mode in order to replace the virtual data with actual data.
 * @param method request method object
 * @param handleUpdate update callback
 */
const updateStateEffect: typeof updateState = async (matcher, handleUpdate) => {
  // Save the target method instance to the current silent method instance
  if (currentSilentMethod) {
    currentSilentMethod.setUpdateState(matcher, isFn(updateState) ? undefinedValue : objectKeys(updateState));
    await currentSilentMethod.save();
  }

  return updateState(matcher, handleUpdate);
};

export default updateStateEffect;
