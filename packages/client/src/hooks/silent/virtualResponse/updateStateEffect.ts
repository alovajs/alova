import updateState from '@/updateState';
import { isFn } from '@alova/shared/function';
import { objectKeys, undefinedValue } from '@alova/shared/vars';
import { currentSilentMethod } from '../createSilentQueueMiddlewares';

/**
 * 更新对应method的状态
 * 与updateState不同的是，除了立即更新状态外，它还会在silent模式下响应后再次更新一次，目的是将虚拟数据替换为实际数据
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 */
const updateStateEffect: typeof updateState = async (matcher, handleUpdate) => {
  // 将目标method实例保存到当前的silentMethod实例
  if (currentSilentMethod) {
    currentSilentMethod.setUpdateState(matcher, isFn(updateState) ? undefinedValue : objectKeys(updateState));
    await currentSilentMethod.save();
  }

  return updateState(matcher, handleUpdate);
};

export default updateStateEffect;
